export type ElfClass = 32 | 64;
export type ElfEndianness = 'little' | 'big';

export interface ArchitectureInfo {
  name: string;
  family: string;
  bits: ElfClass;
  endianness: ElfEndianness;
  description: string;
  color: string;
}

export interface IArchitectureRecognizer {
  recognize(machine: number, eiClass?: number, eiData?: number): ArchitectureInfo | null;
  supportedArchitectures(): string[];
}

export interface ElfHeader {
  ident: Uint8Array;
  ei_mag: string;
  ei_class: number;
  ei_data: number;
  ei_version: number;
  ei_osabi: number;
  ei_abiversion: number;
  e_type: number;
  e_machine: number;
  e_version: number;
  e_entry: bigint;
  e_phoff: bigint;
  e_shoff: bigint;
  e_flags: number;
  e_ehsize: number;
  e_phentsize: number;
  e_phnum: number;
  e_shentsize: number;
  e_shnum: number;
  e_shstrndx: number;
}

export interface SegmentHash {
  sha256: string;
  sha1: string;
}

export interface ProgramHeader {
  index: number;
  p_type: number;
  p_flags: number;
  p_offset: bigint;
  p_vaddr: bigint;
  p_paddr: bigint;
  p_filesz: bigint;
  p_memsz: bigint;
  p_align: bigint;
  hash?: SegmentHash | null;
}

export interface SectionHeader {
  index: number;
  sh_name: number;
  sh_name_str: string;
  sh_type: number;
  sh_flags: bigint;
  sh_addr: bigint;
  sh_offset: bigint;
  sh_size: bigint;
  sh_link: number;
  sh_info: number;
  sh_addralign: bigint;
  sh_entsize: bigint;
  hash?: SegmentHash | null;
}

export interface ElfFile {
  header: ElfHeader;
  programHeaders: ProgramHeader[];
  sectionHeaders: SectionHeader[];
  architecture: ArchitectureInfo | null;
  rawData: ArrayBuffer;
  fileName: string;
  fileSize: number;
}

export interface ParseResult {
  success: boolean;
  data?: ElfFile;
  error?: string;
}
