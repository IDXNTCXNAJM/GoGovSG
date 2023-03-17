import { dummyMaliciousFilePath } from './config'

const fs = require('fs')

/**
 * Create bulk creation csv
 * Overwrites file if exists, else create.
 */
export const createBulkCsv = (fileName: string, longUrls: string[]) => {
  return new Promise((resolve, reject) => {
    try {
      const headers = 'Original links to be shortened'
      const content = [headers, ...longUrls].join('\r\n')
      fs.writeFileSync(fileName, content)
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Overwrite file if exists, else create.
 */
export const createEmptyFileOfSize = (fileName: string, size: number) => {
  return new Promise((resolve, reject) => {
    try {
      const newFile = fs.openSync(fileName, 'w')
      if (size > 0) {
        // Write one byte (with code 0) at the desired offset
        // This forces the expanding of the file and fills the gap
        // with characters with code 0
        fs.writeSync(newFile, Buffer.alloc(1), 0, 1, size - 1)
      }
      fs.closeSync(newFile)
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}

export const createMaliciousFile = async () => {
  // false positive malicious content
  const eicarContent =
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'

  return new Promise((resolve, reject) => {
    try {
      const newFile = fs.openSync(dummyMaliciousFilePath, 'w')
      fs.writeSync(newFile, eicarContent)
      fs.closeSync(newFile)
      resolve(true)
    } catch (err) {
      console.error(err)
      reject(err)
    }
  })
}

/**
 * Delete file.
 */
export const deleteFile = (fileName: string) => {
  return new Promise((resolve, reject) => {
    try {
      fs.unlinkSync(fileName)
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}

export default createEmptyFileOfSize
