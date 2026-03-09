// utils/qrisGenerator.ts
// Generate QRIS static/dynamic + CRC16

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

export function generateQRIS(total: number, paymentId: string) {
  const amount = total.toFixed(2);

  // QRIS template minimal (Merchant Example)
  let payload =
    "000201" +
    "010212" +
    "29370016COM.EXAMPLE.QR01" + // kode merchant contoh
    "52040000" +
    "5303360" +
    `5405${total}` +
    "5802ID" +
    "5908TOKOKU" +
    "6007JAKARTA" +
    `6212${paymentId}` + // metadata custom
    "6304";

  const crc = crc16(payload);
  return payload + crc;
}
