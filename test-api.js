async function test() {
  const res = await fetch("http://localhost:3000/api/stream?id=vnHTrxV7TMc", {
    headers: { 'Range': 'bytes=0-100' }
  });
  console.log(res.status, res.headers.get('content-type'), res.headers.get('content-range'));
}
test();
