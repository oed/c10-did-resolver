import type {
  DIDResolutionResult,
  DIDResolutionOptions,
  DIDDocument,
  ParsedDID,
  Resolver,
  ResolverRegistry
} from 'did-resolver'
import type { CeramicApi } from "@ceramicnetwork/common"
import { ChainID, AccountID } from 'caip'


const DID_LD_JSON = 'application/did+ld+json'
const DID_JSON = 'application/did+json'

/**
 * Gets the unix timestamp from the `versionTime` parameter.
 * @param query
 */
function getVersionTime(query = ''): number | undefined {
  const versionTime = query.split('&').find(e => e.includes('versionTime'))
  if (versionTime) {
    return Math.floor((new Date(versionTime.split('=')[1])).getTime() / 1000)
  }
}

async function accountToDid(account: AccountID, atTime: number, ceramic: CeramicApi): Promise<string | null> {
  const doc = await ceramic.createDocument('caip10-link', {
    metadata: { controllers: [AccountID.format(account)] }
  }, {
    anchor: false
  })
  // TODO - enable a way to do this with one request
  if (atTime) doc = await ceramic.loadDocument(doc.id, { atTime })
  return doc?.content
}

function wrapDocument(did: string, account: AccountID, controller: string): DIDDocument {
  const doc: DIDDocument = {
    id: did,
    verificationMethod: [{
      id: did + '#owner',
      type: 'BlockchainVerificationMethod2021',
      controller: did,
      blockchainAccountId: account.toString()
    }]
  }
  if (controller) {
    doc.controller = controller
  }
  return doc
}

async function resolve(
  did: string,
  methodId: string,
  timestamp: number,
  config: C10ResovlerConfig
): Promise<DIDResolutionResult> {
   // TODO - properly replace chars
  const accountId = AccountID.parse(methodId)
  const controller = await accountToDid(accountId, timestamp, config.ceramic)
  return {
    didResolutionMetadata: { contentType: DID_JSON },
    didDocument: wrapDocument(did, account, controller),
    didDocumentMetadata: {}
  }
}

interface C10ResovlerConfig {
  ceramic: CeramicApi
}

export default {
  getResolver: (config: C10ResovlerConfig): ResolverRegistry => {
    if (!config.ceramic || !config.ethereumRpcs) {
      throw new Error('Invalid config for c10-did-resolver')
    }
    return {
      c10: async (did: string, parsed: ParsedDID, resolver: Resolver, options: DIDResolutionOptions): Promise<DIDResolutionResult> => {
        const contentType = options.accept || DID_JSON
        try {
          const timestamp = getVersionTime(parsed.query)
          const didResult = await resolve(did, parsed.id, timestamp, config)

          if (contentType === DID_LD_JSON) {
            didResult.didDocument['@context'] = 'https://w3id.org/did/v1'
            didResult.didResolutionMetadata.contentType = DID_LD_JSON
          } else if (contentType !== DID_JSON) {
            didResult.didDocument = null
            didResult.didDocumentMetadata = {}
            delete didResult.didResolutionMetadata.contentType
            didResult.didResolutionMetadata.error = 'representationNotSupported'
          }
          return didResult
        } catch (e) {
          return {
            didResolutionMetadata: {
              error: 'invalidDid',
              message: e.toString()
            },
            didDocument: null,
            didDocumentMetadata: {}
          }
        }
      }
    }
  }
}
