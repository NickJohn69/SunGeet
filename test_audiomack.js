async function test() {
  const q = 'starboy';
  const url = `https://audiomack.com/search?q=${encodeURIComponent(q)}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      }
    });
    
    const html = await res.text();
    console.log("HTML Length:", html.length);
    
    // Look for INITIAL_STATE variants
    const match = html.match(/INITIAL_STATE__\s*=\s*(.*?);(?!<\/script>)/) || 
                  html.match(/INITIAL_STATE__\s*=\s*(.*?);<\/script>/);
    
    if (match) {
      const state = JSON.parse(match[1]);
      console.log("Found state!");
      // ...
    } else {
      console.log("INITIAL_STATE not found");
      const scriptTags = html.match(/<script.*?>.*?<\/script>/gs) || [];
      console.log("Found", scriptTags.length, "script tags");
      scriptTags.forEach((s, i) => {
        if (s.includes('STATE')) console.log(`Script ${i} includes 'STATE':`, s.substring(0, 100));
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
