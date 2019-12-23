```
echo "export PATH=$(yarn global bin):$PATH'" >> ~/.bashrc
source ~/.bashrc
yarn install
tsc
chmod +x dist/info.js dist/events.js dist/blocks.js
yarn link
```

TODO: how to import types from Typescript packages?
