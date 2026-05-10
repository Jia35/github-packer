(function bootstrapPackager() {
  const app = (window.PackerForGitHub = window.PackerForGitHub || {});

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);

    for (let index = 0; index < 256; index += 1) {
      let value = index;

      for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      }

      table[index] = value >>> 0;
    }

    return table;
  })();

  function computeCrc32(bytes) {
    let crc = 0xffffffff;

    for (let index = 0; index < bytes.length; index += 1) {
      crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  function getDosDateTime(date) {
    const year = Math.max(1980, date.getFullYear());
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = Math.floor(date.getSeconds() / 2);

    return {
      time: (hours << 11) | (minutes << 5) | seconds,
      date: ((year - 1980) << 9) | (month << 5) | day
    };
  }

  function createLocalHeader(nameBytes, metadata) {
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, metadata.time, true);
    view.setUint16(12, metadata.date, true);
    view.setUint32(14, metadata.crc32, true);
    view.setUint32(18, metadata.size, true);
    view.setUint32(22, metadata.size, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);

    return header;
  }

  function createCentralHeader(nameBytes, metadata, offset) {
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, metadata.time, true);
    view.setUint16(14, metadata.date, true);
    view.setUint32(16, metadata.crc32, true);
    view.setUint32(20, metadata.size, true);
    view.setUint32(24, metadata.size, true);
    view.setUint16(28, nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, offset, true);
    header.set(nameBytes, 46);

    return header;
  }

  function buildZipBlob(files) {
    const encoder = new TextEncoder();
    const zipParts = [];
    const centralDirectory = [];
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.path);
      const metadata = {
        crc32: computeCrc32(file.bytes),
        size: file.bytes.length,
        ...getDosDateTime(new Date())
      };
      const localHeader = createLocalHeader(nameBytes, metadata);
      const centralHeader = createCentralHeader(nameBytes, metadata, offset);

      zipParts.push(localHeader, file.bytes);
      centralDirectory.push(centralHeader);
      offset += localHeader.length + file.bytes.length;
    });

    const centralDirectorySize = centralDirectory.reduce((total, part) => total + part.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);

    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralDirectorySize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    return new Blob([...zipParts, ...centralDirectory, endRecord], {
      type: "application/zip"
    });
  }

  function sanitizeFileNamePart(value) {
    return String(value || "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function createArchiveName(context, branch) {
    const branchName = sanitizeFileNamePart(branch || "repo");
    return `${sanitizeFileNamePart(context.repo)}-${branchName}.zip`;
  }

  function triggerDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  app.packager = {
    buildZipBlob,
    createArchiveName,
    triggerDownload
  };
})();
