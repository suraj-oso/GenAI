import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';
import { exec } from "child_process";
import { promisify } from "util";
import os from 'os';

const platform = os.platform();
const asyncExecute = promisify(exec);
const History = [];
const ai = new GoogleGenAI({ apiKey: "" });

// Helper function to normalize commands based on OS
function getPlatformSpecificCommand(command) {
    if (platform === 'win32') {
        // Convert Unix commands to Windows PowerShell
        if (command.startsWith('touch ')) {
            const filePath = command.replace('touch ', '').replace(/\//g, '\\');
            return `New-Item -Path "${filePath}" -ItemType File`;
        }
        if (command.startsWith('mkdir ')) {
            const dirPath = command.replace('mkdir ', '').replace(/\//g, '\\');
            return `New-Item -ItemType Directory -Path "${dirPath}"`;
        }
        if (command.startsWith('cat ') && command.includes(' > ')) {
            const [catCmd, filePath] = command.split(' > ');
            const contentFile = catCmd.replace('cat ', '').trim();
            return `Get-Content "${contentFile.replace(/\//g, '\\')}" | Out-File -Encoding utf8 "${filePath.trim().replace(/\//g, '\\')}"`;
        }
    }
    return command;
}

// Enhanced executeCommand function with OS-specific handling
async function executeCommand({ command }) {
    try {
        const platformCommand = getPlatformSpecificCommand(command);
        const shell = platform === 'win32' ? 'powershell.exe' : '/bin/bash';
        
        console.log(`Executing: ${platformCommand}`);
        const { stdout, stderr } = await asyncExecute(platformCommand, { shell });

        if (stderr) {
            // Ignore some common non-critical PowerShell warnings
            if (!stderr.includes('ObjectNotFound') && !stderr.includes('CommandNotFoundException')) {
                return `Error: ${stderr}`;
            }
        }
        return `Success: ${stdout || 'Command executed successfully'}`;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

const executeCommandDeclaration = {
    name: "executeCommand",
    description: "Execute a single terminal/shell command for file/folder operations",
    parameters: {
        type: 'OBJECT',
        properties: {
            command: {
                type: 'STRING',
                description: 'Terminal command to execute (will be converted for Windows if needed)'
            },
        },
        required: ['command']   
    }
};

const availableTools = {
    executeCommand
};

async function runAgent(userProblem) {
    History.push({
        role: 'user',
        parts: [{ text: userProblem }]
    });

    while (true) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: History,
                config: {
                    systemInstruction: `You are an expert AI agent specializing in automated frontend web development. Your goal is to build complete, functional frontend websites by executing terminal commands.

Operating System: ${platform} (${platform === 'win32' ? 'Windows' : 'Unix-like'})

<-- CROSS-PLATFORM WORKFLOW -->
1. FIRST create project directory with proper OS-specific command
2. THEN create files (index.html, style.css, script.js) one at a time
3. USE these OS-specific methods for writing files:

**Windows (PowerShell):**
For HTML/CSS/JS files:
@"
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>
"@ | Out-File -Encoding utf8 "project\\index.html"

**Mac/Linux:**
For HTML/CSS/JS files:
cat << 'EOF' > project/index.html
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>
EOF

<-- VALIDATION STEPS -->
After each file operation:
1. Verify file creation (dir/ls)
2. After writing content, read back the file to confirm
3. Proceed only after successful validation

<-- FINAL OUTPUT -->
When complete, provide:
1. Project location
2. Files created
3. How to open the website`,
                    tools: [{
                        functionDeclarations: [executeCommandDeclaration]
                    }],
                },
            });

            if (response.functionCalls && response.functionCalls.length > 0) {
                console.log("Executing:", response.functionCalls[0]);
                const { name, args } = response.functionCalls[0];
                const funCall = availableTools[name];
                const result = await funCall(args);

                History.push({
                    role: "model",
                    parts: [{ functionCall: response.functionCalls[0] }],
                });

                History.push({
                    role: "user",
                    parts: [{ functionResponse: { name, response: { result } } }],
                });
            } else {
                History.push({
                    role: 'model',
                    parts: [{ text: response.text }]
                });
                console.log(response.text);
                break;
            }
        } catch (error) {
            console.error("Error:", error);
            History.push({
                role: 'model',
                parts: [{ text: `Error occurred: ${error.message}` }]
            });
            break;
        }
    }
}

async function main() {
    console.log("🚀 Web Project Builder - Works on Windows & macOS/Linux");
    console.log(`Detected OS: ${platform === 'win32' ? 'Windows' : 'Unix-like'}`);
    
    while (true) {
        const userInput = readlineSync.question("\nDescribe your website (or 'exit' to quit): ");
        if (userInput.toLowerCase() === 'exit') break;
        
        await runAgent(userInput);
    }
    console.log("✨ Your website files are ready! Goodbye!");
}

main();