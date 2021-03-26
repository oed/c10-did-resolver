# C10 DID Resolver

Extremely work in progress. A DID purely based on Ceramic caip10-links that sets the linked DID as the `controller`.

## Getting started

This implementation is still a prototype. Contributions are welcome!

### Installation
TODO!
```
$ npm install c10-did-resolver
```

### Usage

```js
import C10Resolver from 'c10-did-resolver'
import { Resolver } from 'did-resolver'
import Ceramic from '@ceramicnetwork/http-client'

const config = {
  ceramic: new Ceramic() // connects to localhost:7007 by default
}

// getResolver will return an object with a key/value pair of { 'nft': resolver }
// where resolver is a function used by the generic did resolver.
const c10Resolver = C10Resolver.getResolver(config)
const didResolver = Resolver(c10Resolver)

const result = await didResolver.resolve('did:c10:0xff6229bc3655cf0204e850b54397d3651f5198c4_eip155.1')
console.log(result)
```

## Development


Then run tests:
```
$ npm test
```


## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

### TODOs

* Create a CIP for the c10 DID method
* Implement tests
* Publish package
* Finish the [c10-did-provider](https://github.com/oed/c10-did-provider) implementation


## License
Apache-2.0 OR MIT
