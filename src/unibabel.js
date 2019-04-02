

// module.exports= {hexToBuffer,bufferToHex,utf8ToBuffer}

// /** FROM Unibabel **/
// function binaryStringToBuffer(binstr) {
//   var buf;

//   if ('undefined' !== typeof Uint8Array) {
//     buf = new Uint8Array(binstr.length);
//   } else {
//     buf = [];
//   }

//   Array.prototype.forEach.call(binstr, function (ch, i) {
//     buf[i] = ch.charCodeAt(0);
//   });

//   return buf;
// }

// function utf8ToBinaryString(str) {
//   var escstr = encodeURIComponent(str);
//   // replaces any uri escape sequence, such as %0A,
//   // with binary escape, such as 0x0A
//   var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
//     return String.fromCharCode(parseInt(p1, 16));
//   });

//   return binstr;
// }

// function utf8ToBuffer(str) {
//   var binstr = utf8ToBinaryString(str);
//   var buf = binaryStringToBuffer(binstr);
//   return buf;
// }


// function bufferToHex(arr) {
//   if (arr instanceof ArrayBuffer) {
//   	arr = new Uint8Array(arr)
//   }
//   var i;
//   var len;
//   var hex = '';
//   var c;

//   for (i = 0, len = arr.length; i < len; i += 1) {
//     c = arr[i].toString(16);
//     if (c.length < 2) {
//       c = '0' + c;
//     }
//     hex += c;
//   }

//   return hex;
// }

// function hexToBuffer(hex) {
//   var i;
//   var byteLen = hex.length / 2;
//   var arr;
//   var j = 0;

//   if (byteLen !== parseInt(byteLen, 10)) {
//     throw new Error("Invalid hex length '" + hex.length + "'");
//   }

//   arr = new Uint8Array(byteLen);

//   for (i = 0; i < byteLen; i += 1) {
//     arr[i] = parseInt(hex[j] + hex[j + 1], 16);
//     j += 2;
//   }

//   return arr;
// }