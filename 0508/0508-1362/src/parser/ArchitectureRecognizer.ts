import { IArchitectureRecognizer, ArchitectureInfo, ElfClass, ElfEndianness } from './ElfTypes';
import { EM_MACHINE, EI_CLASS, EI_DATA } from './ElfConstants';

export class X86Recognizer implements IArchitectureRecognizer {
  recognize(machine: number, eiClass?: number, eiData?: number): ArchitectureInfo | null {
    if (machine === EM_MACHINE.EM_386 || machine === EM_MACHINE.EM_X86_64) {
      const is64Bit = machine === EM_MACHINE.EM_X86_64 || eiClass === EI_CLASS.ELFCLASS64;
      const endianness: ElfEndianness = eiData === EI_DATA.ELFDATA2MSB ? 'big' : 'little';
      return {
        name: is64Bit ? 'x86-64 (AMD64/Intel 64)' : 'x86 (IA-32)',
        family: 'x86',
        bits: (is64Bit ? 64 : 32) as ElfClass,
        endianness,
        description: is64Bit
          ? 'AMD x86-64 / Intel 64 — 64-bit CISC Architecture'
          : 'Intel IA-32 (80386+) — 32-bit CISC Architecture',
        color: '#3b82f6',
      };
    }
    return null;
  }

  supportedArchitectures(): string[] {
    return ['x86', 'x86-64', 'IA-32', 'AMD64'];
  }
}

export class ARMRecognizer implements IArchitectureRecognizer {
  recognize(machine: number, eiClass?: number, eiData?: number): ArchitectureInfo | null {
    if (machine !== EM_MACHINE.EM_ARM && machine !== EM_MACHINE.EM_AARCH64) {
      return null;
    }

    const is64Bit = machine === EM_MACHINE.EM_AARCH64;
    const endianness: ElfEndianness = eiData === EI_DATA.ELFDATA2MSB ? 'big' : 'little';

    if (is64Bit) {
      return {
        name: 'AArch64 (ARMv8+)',
        family: 'ARM',
        bits: 64 as ElfClass,
        endianness,
        description: 'ARM AArch64 — 64-bit ARMv8/v9 Architecture (ARM64)',
        color: '#10b981',
      };
    }

    const eFlags = 0;
    let armVersion = 'ARMv7';
    let detail = 'ARMv7-A/R/M — 32-bit ARM Architecture';

    if (eFlags & 0xFF000000) {
      const version = (eFlags >> 24) & 0xFF;
      switch (version) {
        case 1: armVersion = 'ARMv4'; detail = 'ARMv4 — 32-bit ARM Architecture'; break;
        case 2: armVersion = 'ARMv4T'; detail = 'ARMv4T — 32-bit ARM Architecture (Thumb)'; break;
        case 3: armVersion = 'ARMv5T'; detail = 'ARMv5T — 32-bit ARM Architecture'; break;
        case 4: armVersion = 'ARMv5TE'; detail = 'ARMv5TE — 32-bit ARM Architecture'; break;
        case 5: armVersion = 'ARMv5TEJ'; detail = 'ARMv5TEJ — 32-bit ARM Architecture (Jazelle)'; break;
        case 6: armVersion = 'ARMv6'; detail = 'ARMv6 — 32-bit ARM Architecture'; break;
        case 7: armVersion = 'ARMv6KZ'; detail = 'ARMv6KZ — 32-bit ARM Architecture'; break;
        case 8: armVersion = 'ARMv6T2'; detail = 'ARMv6T2 — 32-bit ARM Architecture (Thumb-2)'; break;
        case 9: armVersion = 'ARMv6K'; detail = 'ARMv6K — 32-bit ARM Architecture'; break;
        case 10: armVersion = 'ARMv7'; detail = 'ARMv7-A — 32-bit ARM Architecture'; break;
        case 11: armVersion = 'ARMv6-M'; detail = 'ARMv6-M — 32-bit ARM Architecture (Cortex-M0)'; break;
        case 12: armVersion = 'ARMv6S-M'; detail = 'ARMv6S-M — 32-bit ARM Architecture'; break;
        case 13: armVersion = 'ARMv7E-M'; detail = 'ARMv7E-M — 32-bit ARM Architecture (Cortex-M3/M4)'; break;
        case 14: armVersion = 'ARMv8-A'; detail = 'ARMv8-A — 32-bit ARM Architecture (AArch32)'; break;
        case 15: armVersion = 'ARMv8-R'; detail = 'ARMv8-R — 32-bit ARM Architecture'; break;
        case 16: armVersion = 'ARMv8-M'; detail = 'ARMv8-M — 32-bit ARM Architecture'; break;
        default: armVersion = 'ARM'; detail = 'ARM — 32-bit ARM Architecture'; break;
      }
    }

    return {
      name: `${armVersion} (ARM 32-bit)`,
      family: 'ARM',
      bits: 32 as ElfClass,
      endianness,
      description: detail,
      color: '#10b981',
    };
  }

  supportedArchitectures(): string[] {
    return ['ARM', 'ARMv4', 'ARMv5', 'ARMv6', 'ARMv7', 'ARMv8', 'AArch64', 'ARM64', 'Cortex-M', 'Cortex-A', 'Cortex-R'];
  }
}

export class RISCVRecognizer implements IArchitectureRecognizer {
  recognize(machine: number, eiClass?: number, eiData?: number): ArchitectureInfo | null {
    if (machine !== EM_MACHINE.EM_RISCV) {
      return null;
    }

    const endianness: ElfEndianness = eiData === EI_DATA.ELFDATA2MSB ? 'big' : 'little';
    let variant = 'RV64';
    let detail = 'RISC-V 64-bit — 64-bit RISC ISA (RV64G/RV64GC)';

    if (eiClass === EI_CLASS.ELFCLASS32) {
      variant = 'RV32';
      detail = 'RISC-V 32-bit — 32-bit RISC ISA (RV32G/RV32GC/RV32IMC)';
    } else if (eiClass === EI_CLASS.ELFCLASS64) {
      variant = 'RV64';
      detail = 'RISC-V 64-bit — 64-bit RISC ISA (RV64G/RV64GC)';
    }

    return {
      name: `RISC-V (${variant})`,
      family: 'RISC-V',
      bits: (eiClass === EI_CLASS.ELFCLASS64 ? 64 : 32) as ElfClass,
      endianness,
      description: detail,
      color: '#f59e0b',
    };
  }

  supportedArchitectures(): string[] {
    return ['RISC-V', 'RV32', 'RV64', 'RV32I', 'RV32IMC', 'RV64GC'];
  }
}

export class MIPSRecognizer implements IArchitectureRecognizer {
  recognize(machine: number, eiClass?: number, eiData?: number): ArchitectureInfo | null {
    if (machine !== EM_MACHINE.EM_MIPS && machine !== EM_MACHINE.EM_MIPS_RS3_LE) {
      return null;
    }

    const isLE = machine === EM_MACHINE.EM_MIPS_RS3_LE || eiData === EI_DATA.ELFDATA2LSB;
    const is64Bit = eiClass === EI_CLASS.ELFCLASS64;
    const endianness: ElfEndianness = isLE ? 'little' : 'big';
    const endianLabel = isLE ? 'LE' : 'BE';

    let variant = 'MIPS I';
    let detail = `MIPS I — 32-bit ${isLE ? 'Little' : 'Big'}-Endian RISC Architecture`;

    if (is64Bit) {
      variant = 'MIPS64';
      detail = `MIPS-III/IV/64 — 64-bit ${isLE ? 'Little' : 'Big'}-Endian RISC Architecture (MIPS64)`;
    } else {
      if (machine === EM_MACHINE.EM_MIPS_RS3_LE) {
        variant = 'MIPS LE';
        detail = 'MIPS RS3000 Little-Endian — 32-bit RISC Architecture';
      } else {
        variant = 'MIPS32';
        detail = `MIPS I/II/32 — 32-bit ${isLE ? 'Little' : 'Big'}-Endian RISC Architecture (MIPS32)`;
      }
    }

    return {
      name: `${variant} (${endianLabel})`,
      family: 'MIPS',
      bits: (is64Bit ? 64 : 32) as ElfClass,
      endianness,
      description: detail,
      color: '#ef4444',
    };
  }

  supportedArchitectures(): string[] {
    return ['MIPS', 'MIPS32', 'MIPS64', 'MIPS I', 'MIPS II', 'MIPS III', 'MIPS IV', 'MIPS16', 'microMIPS'];
  }
}

export class PPCRecognizer implements IArchitectureRecognizer {
  recognize(machine: number, eiClass?: number, eiData?: number): ArchitectureInfo | null {
    if (machine !== EM_MACHINE.EM_PPC && machine !== EM_MACHINE.EM_PPC64) {
      return null;
    }

    const is64Bit = machine === EM_MACHINE.EM_PPC64 || eiClass === EI_CLASS.ELFCLASS64;
    const endianness: ElfEndianness = eiData === EI_DATA.ELFDATA2MSB ? 'big' : 'little';
    const endianLabel = endianness === 'big' ? 'BE' : 'LE';

    return {
      name: is64Bit ? `PowerPC64 (${endianLabel})` : `PowerPC (${endianLabel})`,
      family: 'PowerPC',
      bits: (is64Bit ? 64 : 32) as ElfClass,
      endianness,
      description: is64Bit
        ? `IBM PowerPC 64-bit ${endianness === 'big' ? 'Big' : 'Little'}-Endian Architecture (PPC64)`
        : `IBM PowerPC 32-bit ${endianness === 'big' ? 'Big' : 'Little'}-Endian Architecture (PPC32)`,
      color: '#8b5cf6',
    };
  }

  supportedArchitectures(): string[] {
    return ['PowerPC', 'PPC', 'PPC32', 'PPC64', 'PowerISA'];
  }
}

export class LoongArchRecognizer implements IArchitectureRecognizer {
  recognize(machine: number, eiClass?: number, eiData?: number): ArchitectureInfo | null {
    if (machine !== EM_MACHINE.EM_LOONGARCH) {
      return null;
    }

    const is64Bit = eiClass === EI_CLASS.ELFCLASS64;
    const endianness: ElfEndianness = eiData === EI_DATA.ELFDATA2MSB ? 'big' : 'little';

    return {
      name: is64Bit ? 'LoongArch64' : 'LoongArch32',
      family: 'LoongArch',
      bits: (is64Bit ? 64 : 32) as ElfClass,
      endianness,
      description: `LoongArch ${is64Bit ? '64-bit' : '32-bit'} RISC Architecture (龙芯)`,
      color: '#ec4899',
    };
  }

  supportedArchitectures(): string[] {
    return ['LoongArch', 'LoongArch32', 'LoongArch64', '龙架构'];
  }
}

export class CSKYRecognizer implements IArchitectureRecognizer {
  recognize(machine: number, eiClass?: number, eiData?: number): ArchitectureInfo | null {
    if (machine !== EM_MACHINE.EM_CSKY) {
      return null;
    }

    const endianness: ElfEndianness = eiData === EI_DATA.ELFDATA2MSB ? 'big' : 'little';

    return {
      name: 'C-SKY',
      family: 'C-SKY',
      bits: 32 as ElfClass,
      endianness,
      description: 'C-SKY 32-bit Embedded RISC Architecture',
      color: '#06b6d4',
    };
  }

  supportedArchitectures(): string[] {
    return ['C-SKY', 'CK810', 'CK807', 'CK803'];
  }
}

export class ArchitectureRecognizerRegistry {
  private recognizers: IArchitectureRecognizer[] = [];

  constructor() {
    this.registerRecognizer(new X86Recognizer());
    this.registerRecognizer(new ARMRecognizer());
    this.registerRecognizer(new RISCVRecognizer());
    this.registerRecognizer(new MIPSRecognizer());
    this.registerRecognizer(new PPCRecognizer());
    this.registerRecognizer(new LoongArchRecognizer());
    this.registerRecognizer(new CSKYRecognizer());
  }

  registerRecognizer(recognizer: IArchitectureRecognizer): void {
    this.recognizers.push(recognizer);
  }

  recognize(machine: number, eiClass?: number, eiData?: number): ArchitectureInfo | null {
    for (const recognizer of this.recognizers) {
      const result = recognizer.recognize(machine, eiClass, eiData);
      if (result) {
        return result;
      }
    }
    return null;
  }

  getAllSupportedArchitectures(): string[] {
    return this.recognizers.flatMap(r => r.supportedArchitectures());
  }
}

export const architectureRecognizer = new ArchitectureRecognizerRegistry();
