async function test() {
  try {
    const res = await fetch('https://www.theaudiodb.com/api/v1/json/2/mvid.php?i=111239');
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.error(e.message);
  }
}
test();
