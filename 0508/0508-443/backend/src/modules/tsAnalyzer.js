const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const TS_PACKET_SIZE = 188;
const TS_SYNC_BYTE = 0x47;
const PAT_PID = 0x0000;
const SDT_PID = 0x0011;
const SDT_ACTUAL_TABLE_ID = 0x42;
const SDT_OTHER_TABLE_ID = 0x46;

async function analyzeTsFile(filePath) {
  const [probeResult, sdtResult] = await Promise.all([
    runFfprobe(filePath),
    parseSdtFromBinary(filePath)
  ]);

  const analysis = parseAnalysisData(probeResult.data, probeResult.stderr);

  analysis.sdtInfo = sdtResult.sdtServices;
  analysis.pidTable = buildPidTable(analysis, sdtResult);

  return analysis;
}

function runFfprobe(filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'debug',
      '-i', filePath,
      '-show_entries', 'stream=index,codec_name,codec_type,codec_long_name,width,height,r_frame_rate,bit_rate,sample_rate,channels,pix_fmt,level,profile',
      '-show_entries', 'format=format_name,format_long_name,duration,size,bit_rate',
      '-show_programs',
      '-of', 'json'
    ];

    execFile(config.ffprobePath, args, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && error.code !== 1) {
        return reject(error);
      }

      try {
        const data = JSON.parse(stdout);
        resolve({ data, stderr: stderr || '' });
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

function parseAnalysisData(data, stderr) {
  const result = {
    format: null,
    programs: [],
    streams: [],
    pidInfo: [],
    errors: []
  };

  if (data.format) {
    result.format = {
      name: data.format.format_name,
      longName: data.format.format_long_name,
      duration: parseFloat(data.format.duration) || 0,
      size: parseInt(data.format.size) || 0,
      bitrate: parseInt(data.format.bit_rate) || 0
    };
  }

  if (data.programs) {
    result.programs = data.programs.map(program => ({
      programId: program.program_id,
      programNum: program.program_num,
      pmtPid: program.pmt_pid,
      pcrPid: program.pcr_pid,
      programName: program.tags ? program.tags.service_name : null,
      providerName: program.tags ? program.tags.service_provider : null,
      streamCount: program.nb_streams,
      streams: program.streams ? program.streams.map(s => s.index) : []
    }));
  }

  if (data.streams) {
    result.streams = data.streams.map(stream => ({
      index: stream.index,
      codecName: stream.codec_name,
      codecType: stream.codec_type,
      codecLongName: stream.codec_long_name,
      profile: stream.profile,
      level: stream.level,
      width: stream.width,
      height: stream.height,
      resolution: stream.width && stream.height ? `${stream.width}x${stream.height}` : null,
      frameRate: parseFrameRate(stream.r_frame_rate),
      bitrate: parseInt(stream.bit_rate) || 0,
      sampleRate: stream.sample_rate ? parseInt(stream.sample_rate) : null,
      channels: stream.channels,
      pixelFormat: stream.pix_fmt
    }));
  }

  result.pidInfo = parsePidInfoFromProbe(data, stderr);
  result.errors = parseErrors(stderr);

  return result;
}

function parseFrameRate(r_frame_rate) {
  if (!r_frame_rate) return 0;
  const parts = r_frame_rate.split('/');
  if (parts.length === 2 && parseInt(parts[1]) !== 0) {
    return parseInt(parts[0]) / parseInt(parts[1]);
  }
  return parseFloat(r_frame_rate) || 0;
}

function parsePidInfoFromProbe(data, stderr) {
  const pidInfo = [];
  const seenPids = new Set();

  if (data.programs) {
    for (const program of data.programs) {
      if (program.pmt_pid && !seenPids.has(program.pmt_pid)) {
        seenPids.add(program.pmt_pid);
        pidInfo.push({
          pid: program.pmt_pid,
          pidHex: `0x${program.pmt_pid.toString(16).toUpperCase().padStart(4, '0')}`,
          type: 'PMT',
          description: `节目 ${program.program_num} 的PMT`
        });
      }
      if (program.pcr_pid && program.pcr_pid !== program.pmt_pid && !seenPids.has(program.pcr_pid)) {
        seenPids.add(program.pcr_pid);
        pidInfo.push({
          pid: program.pcr_pid,
          pidHex: `0x${program.pcr_pid.toString(16).toUpperCase().padStart(4, '0')}`,
          type: 'PCR',
          description: '节目时钟参考'
        });
      }
      if (program.streams) {
        for (const s of program.streams) {
          if (!seenPids.has(s.id)) {
            seenPids.add(s.id);
            pidInfo.push({
              pid: s.id,
              pidHex: `0x${s.id.toString(16).toUpperCase().padStart(4, '0')}`,
              type: getStreamTypeLabel(s.codec_type),
              description: s.codec_name || ''
            });
          }
        }
      }
    }
  }

  const streamRegex = /Stream #0:(\d+)\[0x([0-9a-f]+)\]/gi;
  let match;
  while ((match = streamRegex.exec(stderr)) !== null) {
    const pid = parseInt(match[2], 16);
    if (!seenPids.has(pid)) {
      seenPids.add(pid);
      pidInfo.push({
        pid,
        pidHex: `0x${pid.toString(16).toUpperCase().padStart(4, '0')}`,
        type: '数据',
        description: ''
      });
    }
  }

  pidInfo.sort((a, b) => a.pid - b.pid);
  return pidInfo;
}

function getStreamTypeLabel(codecType) {
  const labels = {
    video: '视频',
    audio: '音频',
    subtitle: '字幕',
    data: '数据'
  };
  return labels[codecType] || codecType || '未知';
}

function parseSdtFromBinary(filePath) {
  return new Promise((resolve) => {
    try {
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const maxReadSize = Math.min(fileSize, 50 * 1024 * 1024);
      const buffer = Buffer.alloc(maxReadSize);
      const fd = fs.openSync(filePath, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, maxReadSize, 0);
      fs.closeSync(fd);

      const sdtServices = parseSdtFromBuffer(buffer, bytesRead);
      resolve({ sdtServices });
    } catch (err) {
      console.warn('SDT binary parse error:', err.message);
      resolve({ sdtServices: [] });
    }
  });
}

function parseSdtFromBuffer(buffer, bufferLength) {
  const sdtServices = [];
  const patEntries = [];
  const pmtStreams = new Map();
  let sdtFound = false;

  const packets = extractTsPackets(buffer, bufferLength);

  for (const packet of packets) {
    if (packet.pid === PAT_PID) {
      const pat = parsePat(packet.payload);
      if (pat && pat.entries) {
        for (const entry of pat.entries) {
          patEntries.push(entry);
          if (!pmtStreams.has(entry.pmtPid)) {
            pmtStreams.set(entry.pmtPid, []);
          }
        }
      }
    } else if (packet.pid === SDT_PID) {
      const sdt = parseSdt(packet.payload);
      if (sdt && sdt.services) {
        for (const svc of sdt.services) {
          const existing = sdtServices.find(s => s.serviceId === svc.serviceId);
          if (!existing) {
            sdtServices.push(svc);
          }
        }
        sdtFound = true;
      }
    }
  }

  for (const patEntry of patEntries) {
    for (const packet of packets) {
      if (packet.pid === patEntry.pmtPid) {
        const pmt = parsePmt(packet.payload);
        if (pmt && pmt.streams) {
          const existing = pmtStreams.get(patEntry.pmtPid);
          if (existing) {
            for (const s of pmt.streams) {
              if (!existing.find(e => e.elementaryPid === s.elementaryPid)) {
                existing.push(s);
              }
            }
          }
        }
      }
    }
  }

  for (const sdt of sdtServices) {
    const patEntry = patEntries.find(p => p.programNum === sdt.serviceId);
    if (patEntry) {
      sdt.pmtPid = patEntry.pmtPid;
      sdt.pmtPidHex = `0x${patEntry.pmtPid.toString(16).toUpperCase().padStart(4, '0')}`;
      const streams = pmtStreams.get(patEntry.pmtPid) || [];
      sdt.streams = streams.map(s => ({
        pid: s.elementaryPid,
        pidHex: `0x${s.elementaryPid.toString(16).toUpperCase().padStart(4, '0')}`,
        streamType: s.streamType,
        streamTypeDesc: getStreamTypeDescription(s.streamType)
      }));
    }
  }

  return sdtServices;
}

function extractTsPackets(buffer, bufferLength) {
  const packets = [];
  let offset = 0;

  while (offset < bufferLength - TS_PACKET_SIZE) {
    if (buffer[offset] !== TS_SYNC_BYTE) {
      offset++;
      continue;
    }

    const packetEnd = offset + TS_PACKET_SIZE;
    if (packetEnd > bufferLength) break;

    const pid = ((buffer[offset + 1] & 0x1F) << 8) | buffer[offset + 2];
    const payloadUnitStart = (buffer[offset + 1] & 0x40) !== 0;
    const adaptationFieldControl = (buffer[offset + 3] & 0x30) >> 4;

    let payloadOffset = offset + 4;

    if (adaptationFieldControl === 0x02) {
      const adaptationFieldLength = buffer[offset + 4];
      payloadOffset = offset + 5 + adaptationFieldLength;
    } else if (adaptationFieldControl === 0x03) {
      const adaptationFieldLength = buffer[offset + 4];
      payloadOffset = offset + 5 + adaptationFieldLength;
    }

    if (payloadOffset < packetEnd) {
      const payload = buffer.slice(payloadOffset, packetEnd);

      packets.push({
        pid,
        payloadUnitStart,
        payload,
        adaptationFieldControl
      });
    }

    offset = packetEnd;
  }

  return packets;
}

function parsePat(payload) {
  if (payload.length < 4) return null;

  const pointerField = payload[0];
  let offset = 1 + pointerField;

  if (offset + 3 >= payload.length) return null;

  const tableId = payload[offset];
  if (tableId !== 0x00) return null;

  const sectionLength = ((payload[offset + 1] & 0x0F) << 8) | payload[offset + 2];
  const transportStreamId = (payload[offset + 3] << 8) | payload[offset + 4];
  const versionNumber = (payload[offset + 5] & 0x3E) >> 1;
  const currentNext = payload[offset + 5] & 0x01;

  const entriesStart = offset + 8;
  const entriesEnd = offset + 3 + sectionLength - 4;

  const entries = [];
  for (let i = entriesStart; i + 3 <= entriesEnd; i += 4) {
    const programNum = (payload[i] << 8) | payload[i + 1];
    const pmtPid = ((payload[i + 2] & 0x1F) << 8) | payload[i + 3];
    if (programNum !== 0) {
      entries.push({ programNum, pmtPid });
    }
  }

  return { tableId, transportStreamId, versionNumber, entries };
}

function parsePmt(payload) {
  if (payload.length < 4) return null;

  const pointerField = payload[0];
  let offset = 1 + pointerField;

  if (offset + 3 >= payload.length) return null;

  const tableId = payload[offset];
  if (tableId !== 0x02) return null;

  const sectionLength = ((payload[offset + 1] & 0x0F) << 8) | payload[offset + 2];
  const pcrPid = ((payload[offset + 8] & 0x1F) << 8) | payload[offset + 9];
  const programInfoLength = ((payload[offset + 10] & 0x0F) << 8) | payload[offset + 11];

  const streamsStart = offset + 12 + programInfoLength;
  const streamsEnd = offset + 3 + sectionLength - 4;

  const streams = [];
  let pos = streamsStart;

  while (pos + 4 <= streamsEnd) {
    const streamType = payload[pos];
    const elementaryPid = ((payload[pos + 1] & 0x1F) << 8) | payload[pos + 2];
    const esInfoLength = ((payload[pos + 3] & 0x0F) << 8) | payload[pos + 4];

    streams.push({ streamType, elementaryPid });
    pos += 5 + esInfoLength;
  }

  return { tableId, pcrPid, streams };
}

function parseSdt(payload) {
  if (payload.length < 12) return null;

  const pointerField = payload[0];
  let offset = 1 + pointerField;

  if (offset + 10 >= payload.length) return null;

  const tableId = payload[offset];
  if (tableId !== SDT_ACTUAL_TABLE_ID && tableId !== SDT_OTHER_TABLE_ID) return null;

  const sectionLength = ((payload[offset + 1] & 0x0F) << 8) | payload[offset + 2];
  const transportStreamId = (payload[offset + 3] << 8) | payload[offset + 4];

  const servicesStart = offset + 8;
  const servicesEnd = offset + 3 + sectionLength - 4;

  const services = [];
  let pos = servicesStart;

  while (pos + 4 <= servicesEnd) {
    const serviceId = (payload[pos] << 8) | payload[pos + 1];
    const eitScheduleFlag = (payload[pos + 2] & 0x02) !== 0;
    const eitPresentFollowing = (payload[pos + 2] & 0x01) !== 0;
    const runningStatus = (payload[pos + 3] & 0xE0) >> 5;
    const freeCaMode = (payload[pos + 3] & 0x10) !== 0;
    const descriptorsLoopLength = ((payload[pos + 3] & 0x0F) << 8) | payload[pos + 4];

    const serviceInfo = {
      serviceId,
      runningStatus,
      runningStatusDesc: getRunningStatusDesc(runningStatus),
      freeCaMode,
      serviceName: null,
      serviceProviderName: null,
      serviceType: null,
      serviceTypeDesc: null
    };

    const descriptorsStart = pos + 5;
    const descriptorsEnd = descriptorsStart + descriptorsLoopLength;

    let descPos = descriptorsStart;
    while (descPos + 2 <= descriptorsEnd && descPos + 2 <= payload.length) {
      const descriptorTag = payload[descPos];
      const descriptorLength = payload[descPos + 1];

      if (descriptorTag === 0x48 && descPos + descriptorLength + 2 <= payload.length) {
        const serviceDescriptor = parseServiceDescriptor(
          payload.slice(descPos + 2, descPos + 2 + descriptorLength)
        );
        if (serviceDescriptor) {
          serviceInfo.serviceType = serviceDescriptor.serviceType;
          serviceInfo.serviceTypeDesc = getServiceTypeDescription(serviceDescriptor.serviceType);
          serviceInfo.serviceName = serviceDescriptor.serviceName;
          serviceInfo.serviceProviderName = serviceDescriptor.serviceProviderName;
        }
      }

      descPos += 2 + descriptorLength;
    }

    services.push(serviceInfo);
    pos = descriptorsEnd;
  }

  return { tableId, transportStreamId, services };
}

function parseServiceDescriptor(buffer) {
  if (buffer.length < 3) return null;

  const serviceType = buffer[0];
  const serviceProviderNameLength = buffer[1];

  if (2 + serviceProviderNameLength >= buffer.length) return null;

  const serviceProviderName = decodeText(buffer.slice(2, 2 + serviceProviderNameLength));

  const serviceNameLengthOffset = 2 + serviceProviderNameLength;
  if (serviceNameLengthOffset >= buffer.length) return null;

  const serviceNameLength = buffer[serviceNameLengthOffset];
  const serviceNameStart = serviceNameLengthOffset + 1;

  if (serviceNameStart + serviceNameLength > buffer.length) return null;

  const serviceName = decodeText(buffer.slice(serviceNameStart, serviceNameStart + serviceNameLength));

  return {
    serviceType,
    serviceProviderName,
    serviceName
  };
}

function decodeText(buffer) {
  if (buffer.length === 0) return '';

  const firstByte = buffer[0];

  if (firstByte >= 0x20) {
    return buffer.toString('utf8');
  }

  let encoding = 'utf8';
  let startOffset = 0;

  switch (firstByte) {
    case 0x01:
      encoding = 'latin1';
      startOffset = 1;
      break;
    case 0x02:
      encoding = 'utf16le';
      startOffset = 1;
      break;
    case 0x03:
      encoding = 'utf8';
      startOffset = 1;
      break;
    case 0x04:
      encoding = 'utf16le';
      startOffset = 1;
      break;
    case 0x05:
      encoding = 'utf8';
      startOffset = 1;
      break;
    case 0x0F:
    case 0x10:
    case 0x11:
    case 0x12:
    case 0x13:
    case 0x14:
    case 0x15:
      startOffset = 1;
      break;
    default:
      if (firstByte < 0x20) {
        startOffset = 1;
      }
      break;
  }

  try {
    if (encoding === 'utf16le') {
      let result = '';
      for (let i = startOffset; i < buffer.length - 1; i += 2) {
        const code = buffer[i] | (buffer[i + 1] << 8);
        if (code >= 0x20 && code !== 0xFFFF) {
          result += String.fromCharCode(code);
        }
      }
      return result.trim();
    }

    const str = buffer.toString(encoding, startOffset);
    return str.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
  } catch (e) {
    return buffer.toString('utf8', startOffset).replace(/[\x00-\x1F]/g, '').trim();
  }
}

function getRunningStatusDesc(status) {
  const descs = {
    0: '未定义',
    1: '未运行',
    2: '即将开始',
    3: '暂停',
    4: '运行中',
    5: '即将停止',
    6: '离线',
    7: '保留'
  };
  return descs[status] || '未知';
}

function getServiceTypeDescription(type) {
  const descs = {
    0x01: '数字电视服务',
    0x02: '数字电台服务',
    0x03: '图文电视服务',
    0x04: 'NVOD参考服务',
    0x05: 'NVOD时移服务',
    0x06: '马赛克服务',
    0x07: 'FM电台服务',
    0x08: 'DVB SRM服务',
    0x09: '高级编解码广播',
    0x0A: '高级编解码马赛克',
    0x0B: '高级编解码数据广播',
    0x0C: '高级编解码互联网广播',
    0x0D: '高级编解码电视服务',
    0x0E: '高级编解码电视马赛克',
    0x16: 'H.264数字电视服务',
    0x17: 'H.264数字电台服务',
    0x19: 'H.264高级电视服务',
    0x1A: 'HEVC数字电视服务',
    0x1B: 'HEVC高级电视服务',
    0x1C: 'HEVC数字电台服务'
  };
  return descs[type] || `服务类型 0x${type.toString(16).toUpperCase().padStart(2, '0')}`;
}

function getStreamTypeDescription(streamType) {
  const descs = {
    0x01: 'MPEG-1 视频',
    0x02: 'MPEG-2 视频',
    0x03: 'MPEG-1 音频',
    0x04: 'MPEG-2 音频',
    0x05: 'MPEG-2 私有段落',
    0x06: 'MPEG-2 PES 私有数据',
    0x07: 'MHEG',
    0x08: 'DSM-CC',
    0x09: 'H.222.1',
    0x0A: 'MPEG-2 A/B',
    0x0B: 'MPEG-2 DSM-CC',
    0x0C: 'MPEG-2 DSM-CC U-N',
    0x0D: 'MPEG-2 DSM-CC 同步下载',
    0x0E: 'MPEG-2 DSM-CC 同步下载',
    0x0F: 'MPEG-2 传输流',
    0x10: 'MPEG-2 节目流',
    0x11: 'MPEG-2 AAC',
    0x1B: 'H.264/AVC 视频',
    0x1C: 'H.264/AVC 时间可分级',
    0x1D: 'H.264/AVC 空间可分级',
    0x1E: 'H.264/AVC 质量',
    0x1F: 'H.264/AVC 高级',
    0x20: 'MPEG-4 视频',
    0x21: 'MPEG-4 AAC',
    0x24: 'HEVC/H.265 视频',
    0x25: 'HEVC/H.265 时间可分级',
    0x27: 'HEVC/H.265 空间可分级',
    0x2A: 'HEVC/H.265 质量',
    0x2B: 'HEVC/H.265 高级',
    0x81: 'AC-3 音频',
    0x82: 'DTS 音频',
    0x83: 'SDDS 音频',
    0x86: 'DTS-HD 音频',
    0x87: 'E-AC-3 音频',
    0x90: 'PNG',
    0x95: 'SMPTE VC-1'
  };
  return descs[streamType] || `流类型 0x${streamType.toString(16).toUpperCase().padStart(2, '0')}`;
}

function buildPidTable(analysis, sdtResult) {
  const pidTable = [];
  const seenPids = new Map();

  const staticPids = [
    { pid: 0x0000, pidHex: '0x0000', type: 'PAT', description: '节目关联表' },
    { pid: 0x0010, pidHex: '0x0010', type: 'NIT', description: '网络信息表' },
    { pid: 0x0011, pidHex: '0x0011', type: 'SDT', description: '服务描述表' },
    { pid: 0x0012, pidHex: '0x0012', type: 'EIT', description: '事件信息表' },
    { pid: 0x0014, pidHex: '0x0014', type: 'TDT', description: '时间日期表' }
  ];

  for (const sp of staticPids) {
    seenPids.set(sp.pid, sp);
  }

  for (const sdt of sdtResult.sdtServices) {
    if (sdt.pmtPid && !seenPids.has(sdt.pmtPid)) {
      const entry = {
        pid: sdt.pmtPid,
        pidHex: `0x${sdt.pmtPid.toString(16).toUpperCase().padStart(4, '0')}`,
        type: 'PMT',
        description: `PMT - ${sdt.serviceName || '节目 ' + sdt.serviceId}`,
        serviceName: sdt.serviceName,
        serviceProviderName: sdt.serviceProviderName,
        serviceId: sdt.serviceId
      };
      seenPids.set(sdt.pmtPid, entry);
    }

    if (sdt.streams) {
      for (const stream of sdt.streams) {
        if (!seenPids.has(stream.pid)) {
          seenPids.set(stream.pid, {
            pid: stream.pid,
            pidHex: stream.pidHex,
            type: stream.streamTypeDesc ? stream.streamTypeDesc.split(' ')[0] : '数据',
            description: stream.streamTypeDesc || '',
            serviceName: sdt.serviceName,
            serviceProviderName: sdt.serviceProviderName,
            serviceId: sdt.serviceId
          });
        }
      }
    }
  }

  for (const pi of analysis.pidInfo) {
    if (!seenPids.has(pi.pid)) {
      seenPids.set(pi.pid, {
        pid: pi.pid,
        pidHex: pi.pidHex,
        type: pi.type,
        description: pi.description,
        serviceName: null,
        serviceProviderName: null
      });
    } else {
      const existing = seenPids.get(pi.pid);
      if (!existing.description && pi.description) {
        existing.description = pi.description;
      }
      if (!existing.type || existing.type === '数据') {
        existing.type = pi.type;
      }
    }
  }

  for (const stream of analysis.streams) {
    const matchingPid = analysis.pidInfo.find(p => {
      return p.description && (
        (stream.codecType === 'video' && p.type === '视频') ||
        (stream.codecType === 'audio' && p.type === '音频')
      );
    });

    if (matchingPid && !seenPids.get(matchingPid.pid)?.codecInfo) {
      const entry = seenPids.get(matchingPid.pid);
      if (entry) {
        entry.codecInfo = `${stream.codecName || ''} ${stream.resolution || ''} ${stream.frameRate ? stream.frameRate.toFixed(0) + 'fps' : ''}`.trim();
      }
    }
  }

  const result = Array.from(seenPids.values());
  result.sort((a, b) => a.pid - b.pid);
  return result;
}

function parseErrors(stderr) {
  const errors = [];
  if (!stderr) return errors;
  const lines = stderr.split('\n');

  for (const line of lines) {
    if (line.includes('error') || line.includes('Error') || line.includes('ERROR')) {
      if (line.includes('Continuity counter error')) {
        const match = line.match(/Continuity counter error (\d+)/i);
        errors.push({
          type: 'continuity_error',
          count: match ? parseInt(match[1]) : 1,
          message: line.trim()
        });
      } else if (!line.includes('ffprobe') && !line.includes('Option') && !line.includes('Decoder')) {
        errors.push({
          type: 'general',
          message: line.trim()
        });
      }
    }
  }

  return errors;
}

module.exports = {
  analyzeTsFile
};
