
*This Package holds a patch for nodejs >=0.11*

to opt-in until nodejs merges this (or not) you can use this package as a drop-in replacement.

```bash
npm install tls-connect
```

This works also on node < 0.11 because it's using createSecurePair instead of TLSSocket then.
