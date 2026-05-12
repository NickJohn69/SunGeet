async function test() {
  try {
    const res = await fetch('https://api.lyrics.ovh/v1/coldplay/yellow');
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.error(e.message);
  }
}
test();
