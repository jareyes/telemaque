import createPiperPhonemize from "/vendor/piper-phonemize/piper_phonemize.js";

const piper = await createPiperPhonemize({
    locateFile: (path, script_dirpath) => {
        // Redirect to the correct directory
        if (path.endsWith(".data") || path.endsWith(".wasm")) {
            return `/vendor/piper-phonemize/${path}`;
        }
        return script_dirpath + path;
    }
});

// Try to call piper with some text
// First, let's write our input text to a file
piper.FS.writeFile('/input.txt', 'Ciao mondo');

// Capture stdout
let output = '';
piper.stdout = (char) => {
  output += String.fromCharCode(char);
};

// Try calling the main function
// Arguments: program name, input file, language
try {
  const result = piper.callMain(['-l', 'it', '--input', '/input.txt']);
  console.log("Result:", result);
  console.log("Output:", output);
} catch(e) {
  console.error("Error calling piper:", e);
}
