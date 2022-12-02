import http, { RequestOptions } from 'http'
import https from 'https'
import queryString, { ParsedQuery } from 'query-string'


export async function sleep(timeoutMs: number) {
  return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), timeoutMs)
  })
}

// Requests

class HttpError extends Error {
  answer?: Buffer
}

export function reqGet(url: string, params: ParsedQuery = {}): Promise<Buffer> {
  const urlJoined = queryString.stringifyUrl({ url, query: params })
  return new Promise((resolve, reject) => {
    const get_f = urlJoined.startsWith('http://') ? http.get : https.get
    let req = get_f(urlJoined, (res) => {
      let buffers: Buffer[] = []

      res.on('data', (d) => {
        buffers.push(d);
      });

      res.on('end', () => {
        const answer = Buffer.concat(buffers)
        if (res.statusCode && res.statusCode >= 400) {
          const err = new HttpError(`${res.statusCode} ${res.statusMessage}`)
          err.answer = answer
          reject(err)
        }
        else {
          resolve(answer)
        }
      })
    });
    req.on('error', reject)
  })
}

export function reqPost(url: string, params: ParsedQuery = {}, data: string = ""): Promise<Buffer> {
  const urlJoined = queryString.stringifyUrl({ url, query: params })
  const dataBuf = Buffer.from(data)
  const opts : RequestOptions = {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': dataBuf.length
      }
  };

  return new Promise((resolve, reject) => {
    const req_f = urlJoined.startsWith('http://') ? http.request : https.request
    let req = req_f(urlJoined, opts, (res) => {
      let respBuffers: Buffer[] = []

      res.on('data', (d) => {
        respBuffers.push(d);
      });

      res.on('end', () => {
        const answer = Buffer.concat(respBuffers)
        if (res.statusCode && res.statusCode >= 400) {
          const err = new HttpError(`${res.statusCode} ${res.statusMessage}`)
          err.answer = answer
          reject(err)
        }
        else {
          resolve(answer)
        }
      })
    });
    req.on('error', reject)
    req.write(dataBuf);
    req.end();
  })

}