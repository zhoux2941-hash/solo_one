export class BinaryReader {
  private view: DataView;
  private offset: number;
  private littleEndian: boolean;

  constructor(buffer: ArrayBuffer, littleEndian: boolean = true) {
    this.view = new DataView(buffer);
    this.offset = 0;
    this.littleEndian = littleEndian;
  }

  setEndianness(littleEndian: boolean): void {
    this.littleEndian = littleEndian;
  }

  getEndianness(): boolean {
    return this.littleEndian;
  }

  seek(offset: number): void {
    if (offset < 0 || offset >= this.view.byteLength) {
      throw new Error(`Seek out of bounds: ${offset}`);
    }
    this.offset = offset;
  }

  getOffset(): number {
    return this.offset;
  }

  getLength(): number {
    return this.view.byteLength;
  }

  readUint8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readUint16(): number {
    const value = this.view.getUint16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }

  readUint32(): number {
    const value = this.view.getUint32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  readUint64(): bigint {
    const value = this.view.getBigUint64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  readInt8(): number {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readInt16(): number {
    const value = this.view.getInt16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }

  readInt32(): number {
    const value = this.view.getInt32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  readInt64(): bigint {
    const value = this.view.getBigInt64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  readBytes(length: number): Uint8Array {
    const value = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, length);
    this.offset += length;
    return value;
  }

  readString(length: number): string {
    const bytes = this.readBytes(length);
    return String.fromCharCode(...bytes);
  }

  readNullTerminatedString(maxLength: number = 1024): string {
    const startOffset = this.offset;
    let length = 0;
    while (this.offset < this.view.byteLength && this.readUint8() !== 0 && length < maxLength) {
      length++;
    }
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + startOffset, length);
    return String.fromCharCode(...bytes);
  }

  readStringAt(offset: number, maxLength: number = 1024): string {
    const savedOffset = this.offset;
    this.seek(offset);
    const str = this.readNullTerminatedString(maxLength);
    this.seek(savedOffset);
    return str;
  }

  getUint8At(offset: number): number {
    return this.view.getUint8(offset);
  }

  getUint16At(offset: number): number {
    return this.view.getUint16(offset, this.littleEndian);
  }

  getUint32At(offset: number): number {
    return this.view.getUint32(offset, this.littleEndian);
  }

  getUint64At(offset: number): bigint {
    return this.view.getBigUint64(offset, this.littleEndian);
  }

  getBytesAt(offset: number, length: number): Uint8Array {
    return new Uint8Array(this.view.buffer, this.view.byteOffset + offset, length);
  }

  slice(offset: number, length: number): ArrayBuffer {
    return this.view.buffer.slice(this.view.byteOffset + offset, this.view.byteOffset + offset + length);
  }
}
