# node-growing-mongofile

A hack of [node-growing-file][1] by Felix Geisendörfer to stream file from mongodb instead of the local filesystem

## Installation

    npm install growing-mongofile

## Usage

    var file = GrowingFile.open(db, 'my-growing-file.dat' [, options [, callback]]);
    file.pipe(<some writeable stream>);

The file being read must exist in mongodb. Thus, when saving it, you must close it and re-open it.
For this, you can simply use :

    GrowingFile.createGridStore(db, filename, metadata, callback)


## License

Written by Tugdual de Kerviler, licensed under the MIT license.

[1]: https://github.com/felixge/node-growing-file
