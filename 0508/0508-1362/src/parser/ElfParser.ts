import { BinaryReader } from './BinaryReader';
import { ElfHeader, ProgramHeader, SectionHeader, ElfFile, ParseResult, SegmentHash } from './ElfTypes';
import { architectureRecognizer } from './ArchitectureRecognizer';
import { computeSegmentHash } from './HashUtils';
import {
  ELF_MAGIC,
  EI_CLASS,
  EI_DATA,
  EM_MACHINE,
  EM_MACHINE_NAMES,
  SH_TYPE,
} from './ElfConstants';

export class ElfParser {
  private reader: BinaryReader;
  private is64Bit: boolean = false;

  constructor(buffer: ArrayBuffer) {
    this.reader = new BinaryReader(buffer);
  }

  parse(fileName: string): ParseResult {
    try {
      this.reader.seek(0);

      if (!this.validateMagic()) {
        return { success: false, error: 'Invalid ELF magic number' };
      }

      const header = this.parseHeader();
      this.is64Bit = header.ei_class === EI_CLASS.ELFCLASS64;

      this.reader.setEndianness(header.ei_data === EI_DATA.ELFDATA2LSB);

      const programHeaders = this.parseProgramHeaders(header);
      const sectionHeaders = this.parseSectionHeaders(header);
      const architecture = architectureRecognizer.recognize(
        header.e_machine,
        header.ei_class,
        header.ei_data
      );

      return {
        success: true,
        data: {
          header,
          programHeaders,
          sectionHeaders,
          architecture,
          rawData: this.reader.slice(0, this.reader.getLength()),
          fileName,
          fileSize: this.reader.getLength(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  private validateMagic(): boolean {
    const magic = this.reader.getUint32At(0);
    return magic === ELF_MAGIC;
  }

  private parseHeader(): ElfHeader {
    this.reader.seek(0);

    const ident = this.reader.readBytes(16);
    const ei_mag = String.fromCharCode(ident[0], ident[1], ident[2], ident[3]);
    const ei_class = ident[4];
    const ei_data = ident[5];
    const ei_version = ident[6];
    const ei_osabi = ident[7];
    const ei_abiversion = ident[8];

    const is64 = ei_class === EI_CLASS.ELFCLASS64;
    this.reader.setEndianness(ei_data === EI_DATA.ELFDATA2LSB);

    const e_type = this.reader.readUint16();
    const e_machine = this.reader.readUint16();
    const e_version = this.reader.readUint32();

    let e_entry: bigint;
    let e_phoff: bigint;
    let e_shoff: bigint;

    if (is64) {
      e_entry = this.reader.readUint64();
      e_phoff = this.reader.readUint64();
      e_shoff = this.reader.readUint64();
    } else {
      e_entry = BigInt(this.reader.readUint32());
      e_phoff = BigInt(this.reader.readUint32());
      e_shoff = BigInt(this.reader.readUint32());
    }

    const e_flags = this.reader.readUint32();
    const e_ehsize = this.reader.readUint16();
    const e_phentsize = this.reader.readUint16();
    const e_phnum = this.reader.readUint16();
    const e_shentsize = this.reader.readUint16();
    const e_shnum = this.reader.readUint16();
    const e_shstrndx = this.reader.readUint16();

    return {
      ident,
      ei_mag,
      ei_class,
      ei_data,
      ei_version,
      ei_osabi,
      ei_abiversion,
      e_type,
      e_machine,
      e_version,
      e_entry,
      e_phoff,
      e_shoff,
      e_flags,
      e_ehsize,
      e_phentsize,
      e_phnum,
      e_shentsize,
      e_shnum,
      e_shstrndx,
    };
  }

  private parseProgramHeaders(header: ElfHeader): ProgramHeader[] {
    const headers: ProgramHeader[] = [];
    const is64 = header.ei_class === EI_CLASS.ELFCLASS64;
    const offset = Number(header.e_phoff);
    const count = header.e_phnum;
    const size = header.e_phentsize;

    for (let i = 0; i < count; i++) {
      this.reader.seek(offset + i * size);
      headers.push(this.parseProgramHeader(is64, i));
    }

    return headers;
  }

  private parseProgramHeader(is64: boolean, index: number): ProgramHeader {
    let p_type: number;
    let p_flags: number;
    let p_offset: bigint;
    let p_vaddr: bigint;
    let p_paddr: bigint;
    let p_filesz: bigint;
    let p_memsz: bigint;
    let p_align: bigint;

    if (is64) {
      p_type = this.reader.readUint32();
      p_flags = this.reader.readUint32();
      p_offset = this.reader.readUint64();
      p_vaddr = this.reader.readUint64();
      p_paddr = this.reader.readUint64();
      p_filesz = this.reader.readUint64();
      p_memsz = this.reader.readUint64();
      p_align = this.reader.readUint64();
    } else {
      p_type = this.reader.readUint32();
      p_offset = BigInt(this.reader.readUint32());
      p_vaddr = BigInt(this.reader.readUint32());
      p_paddr = BigInt(this.reader.readUint32());
      p_filesz = BigInt(this.reader.readUint32());
      p_memsz = BigInt(this.reader.readUint32());
      p_flags = this.reader.readUint32();
      p_align = BigInt(this.reader.readUint32());
    }

    return {
      index,
      p_type,
      p_flags,
      p_offset,
      p_vaddr,
      p_paddr,
      p_filesz,
      p_memsz,
      p_align,
    };
  }

  private parseSectionHeaders(header: ElfHeader): SectionHeader[] {
    const headers: SectionHeader[] = [];
    const is64 = header.ei_class === EI_CLASS.ELFCLASS64;
    const offset = Number(header.e_shoff);
    const count = header.e_shnum;
    const size = header.e_shentsize;
    const strTabIndex = header.e_shstrndx;

    for (let i = 0; i < count; i++) {
      this.reader.seek(offset + i * size);
      headers.push(this.parseSectionHeader(is64, i));
    }

    if (strTabIndex < headers.length) {
      const strTab = headers[strTabIndex];
      const strTabOffset = Number(strTab.sh_offset);
      for (const sh of headers) {
        if (sh.sh_name !== 0) {
          sh.sh_name_str = this.reader.readStringAt(strTabOffset + sh.sh_name);
        }
      }
    }

    return headers;
  }

  private parseSectionHeader(is64: boolean, index: number): SectionHeader {
    const sh_name = this.reader.readUint32();
    const sh_type = this.reader.readUint32();
    let sh_flags: bigint;
    let sh_addr: bigint;
    let sh_offset: bigint;
    let sh_size: bigint;
    const sh_link = this.reader.readUint32();
    const sh_info = this.reader.readUint32();
    let sh_addralign: bigint;
    let sh_entsize: bigint;

    if (is64) {
      sh_flags = this.reader.readUint64();
      sh_addr = this.reader.readUint64();
      sh_offset = this.reader.readUint64();
      sh_size = this.reader.readUint64();
      sh_addralign = this.reader.readUint64();
      sh_entsize = this.reader.readUint64();
    } else {
      sh_flags = BigInt(this.reader.readUint32());
      sh_addr = BigInt(this.reader.readUint32());
      sh_offset = BigInt(this.reader.readUint32());
      sh_size = BigInt(this.reader.readUint32());
      sh_addralign = BigInt(this.reader.readUint32());
      sh_entsize = BigInt(this.reader.readUint32());
    }

    return {
      index,
      sh_name,
      sh_name_str: '',
      sh_type,
      sh_flags,
      sh_addr,
      sh_offset,
      sh_size,
      sh_link,
      sh_info,
      sh_addralign,
      sh_entsize,
    };
  }

  static parseBuffer(buffer: ArrayBuffer, fileName: string): ParseResult {
    const parser = new ElfParser(buffer);
    return parser.parse(fileName);
  }

  static async computeAllSegmentHashes(elfFile: ElfFile): Promise<ElfFile> {
    const updatedProgramHeaders = [...elfFile.programHeaders];
    const updatedSectionHeaders = [...elfFile.sectionHeaders];

    for (let i = 0; i < updatedProgramHeaders.length; i++) {
      const ph = updatedProgramHeaders[i];
      if (ph.p_filesz > 0) {
        const hash = await computeSegmentHash(elfFile.rawData, ph.p_offset, ph.p_filesz);
        updatedProgramHeaders[i] = { ...ph, hash };
      }
    }

    for (let i = 0; i < updatedSectionHeaders.length; i++) {
      const sh = updatedSectionHeaders[i];
      if (sh.sh_size > 0 && sh.sh_type !== SH_TYPE.SHT_NOBITS) {
        const hash = await computeSegmentHash(elfFile.rawData, sh.sh_offset, sh.sh_size);
        updatedSectionHeaders[i] = { ...sh, hash };
      }
    }

    return {
      ...elfFile,
      programHeaders: updatedProgramHeaders,
      sectionHeaders: updatedSectionHeaders,
    };
  }

  static async computeProgramHeaderHash(
    rawData: ArrayBuffer,
    ph: ProgramHeader
  ): Promise<SegmentHash | null> {
    if (ph.p_filesz === 0n) return null;
    return computeSegmentHash(rawData, ph.p_offset, ph.p_filesz);
  }

  static async computeSectionHeaderHash(
    rawData: ArrayBuffer,
    sh: SectionHeader
  ): Promise<SegmentHash | null> {
    if (sh.sh_size === 0n || sh.sh_type === SH_TYPE.SHT_NOBITS) return null;
    return computeSegmentHash(rawData, sh.sh_offset, sh.sh_size);
  }
}

export function getMachineName(machine: number): string {
  return EM_MACHINE_NAMES[machine] || `Unknown (0x${machine.toString(16)})`;
}
