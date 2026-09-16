const textEncoder = new TextEncoder();

function dateToDosTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  return (hours << 11) | (minutes << 5) | seconds;
}

function dateToDosDate(date: Date) {
  const year = Math.max(date.getFullYear(), 1980) - 1980;
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return (year << 9) | (month << 5) | day;
}

function makeCrc32Table() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

const crc32Table = makeCrc32Table();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function concatChunks(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });

  return output;
}

export type ZipFileInput = {
  name: string;
  bytes: Uint8Array;
  modifiedAt?: Date;
};

export function createZip(files: ZipFileInput[]) {
  const localChunks: Uint8Array[] = [];
  const centralDirectoryChunks: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const modifiedAt = file.modifiedAt ?? new Date();
    const fileName = textEncoder.encode(file.name.replaceAll("\\", "/"));
    const checksum = crc32(file.bytes);
    const dosTime = dateToDosTime(modifiedAt);
    const dosDate = dateToDosDate(modifiedAt);
    const localHeader = new Uint8Array(30 + fileName.length);
    const centralHeader = new Uint8Array(46 + fileName.length);

    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0x0800);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, dosTime);
    writeUint16(localHeader, 12, dosDate);
    writeUint32(localHeader, 14, checksum);
    writeUint32(localHeader, 18, file.bytes.length);
    writeUint32(localHeader, 22, file.bytes.length);
    writeUint16(localHeader, 26, fileName.length);
    localHeader.set(fileName, 30);

    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0x0800);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, dosTime);
    writeUint16(centralHeader, 14, dosDate);
    writeUint32(centralHeader, 16, checksum);
    writeUint32(centralHeader, 20, file.bytes.length);
    writeUint32(centralHeader, 24, file.bytes.length);
    writeUint16(centralHeader, 28, fileName.length);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(fileName, 46);

    localChunks.push(localHeader, file.bytes);
    centralDirectoryChunks.push(centralHeader);
    offset += localHeader.length + file.bytes.length;
  });

  const centralDirectoryOffset = offset;
  const centralDirectory = concatChunks(centralDirectoryChunks);
  const endOfCentralDirectory = new Uint8Array(22);

  writeUint32(endOfCentralDirectory, 0, 0x06054b50);
  writeUint16(endOfCentralDirectory, 8, files.length);
  writeUint16(endOfCentralDirectory, 10, files.length);
  writeUint32(endOfCentralDirectory, 12, centralDirectory.length);
  writeUint32(endOfCentralDirectory, 16, centralDirectoryOffset);

  return concatChunks([
    ...localChunks,
    centralDirectory,
    endOfCentralDirectory,
  ]);
}
