import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';
import { exec } from "child_process";
import { promisify } from "util";
import os from 'os';
import fs from 'fs';

const platform = os.platform();
const asyncExecute = promisify(exec);
const History = [];
const ai = new GoogleGenAI({ apiKey: "" });

// Helper function to normalize paths based on OS
function normalizePath(path) {
    return platform === 'win32' ? path.replace(/\//g, '\\') : path;
}

// Tool to execute commands with Windows PowerShell support
async function executeCommand({ command }) {
    try {
        let winCommand = command;
        
        // Convert Unix-style commands to PowerShell
        if (command.startsWith('touch ')) {
            const filePath = normalizePath(command.replace('touch ', ''));
            winCommand = `New-Item -Path "${filePath}" -ItemType File`;
        }
        else if (command.includes('echo ') && command.includes(' > ')) {
            const [content, filePath] = command.split(' > ');
            const normalizedPath = normalizePath(filePath.trim());
            const escapedContent = content.replace('echo ', '').replace(/"/g, '`"');
            winCommand = `"${escapedContent}" | Out-File -Encoding utf8 "${normalizedPath}"`;
        }
        else if (command.includes('mkdir ')) {
            const dirPath = normalizePath(command.replace('mkdir ', ''));
            winCommand = `New-Item -ItemType Directory -Path "${dirPath}"`;
        }

        const { stdout, stderr } = await asyncExecute(winCommand, { shell: 'powershell.exe' });

        if (stderr) {
            return `Error: ${stderr}`;
        }
        return `Success: ${stdout || 'Command executed successfully'}`;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

// Tool to write content to files (more reliable for Windows)
async function writeFileContent({ filePath, content }) {
    try {
        const normalizedPath = normalizePath(filePath);
        await fs.promises.writeFile(normalizedPath, content, 'utf8');
        return `Success: Content written to ${normalizedPath}`;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

const toolDeclarations = {
    executeCommand: {
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
    },
    writeFileContent: {
        name: "writeFileContent",
        description: "Write content to a file (more reliable than echo commands)",
        parameters: {
            type: 'OBJECT',
            properties: {
                filePath: {
                    type: 'STRING',
                    description: 'Path to the file including filename'
                },
                content: {
                    type: 'STRING',
                    description: 'Content to write to the file'
                },
            },
            required: ['filePath', 'content']   
        }
    }
};

const availableTools = {
    executeCommand,
    writeFileContent
};

async function runAgent(userProblem) {
    History.push({
        role: 'user',
        parts: [{ text: userProblem }]
    });

    while (true) {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: History,
            config: {
                systemInstruction: `You are a professional website builder assistant. Your task is to help users create complete website projects by generating the necessary files and code.

                Current OS: ${platform} (Windows PowerShell)
                Important Guidelines:
                1. Always use Windows PowerShell compatible commands
                2. For file paths, use double backslashes (\\\\) or forward slashes (/)
                3. For writing file content, prefer using the writeFileContent tool
                4. Create these standard files for each project:
                   - index.html (main HTML file)
                   - style.css (styles)
                   - script.js (JavaScript)
                
                Project Structure Example:
                1. Create project folder: mkdir my-project
                2. Create files inside it
                3. Write proper starter code to each file
                4. Provide clear instructions to the user

                For HTML content, include proper doctype, meta tags, and semantic structure.
                For CSS, include basic reset styles and responsive design considerations.
                For JavaScript, include DOMContentLoaded event listener.`,
                tools: [{
                    functionDeclarations: [toolDeclarations.executeCommand, toolDeclarations.writeFileContent]
                }],
            },
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            console.log("Executing:", response.functionCalls[0]);
            const { name, args } = response.functionCalls[0];
            const funCall = availableTools[name];
            const result = await funCall(args);

            const functionResponsePart = {
                name: name,
                response: {
                    result: result,
                },
            };

            History.push({
                role: "model",
                parts: [{
                    functionCall: response.functionCalls[0],
                }],
            });

            History.push({
                role: "user",
                parts: [{
                    functionResponse: functionResponsePart,
                }],
            });
        } else {
            History.push({
                role: 'model',
                parts: [{ text: response.text }]
            });
            console.log(response.text);
            break;
        }
    }
}

async function main() {
    console.log("Website Builder Assistant (Windows PowerShell)");
    console.log("Tell me what website you want to create (e.g., 'portfolio site', 'e-commerce page')");
    
    while (true) {
        const userInput = readlineSync.question("\nYour request (or type 'exit' to quit): ");
        if (userInput.toLowerCase() === 'exit') break;
        await runAgent(userInput);
    }
    console.log("Goodbye! Your website files are ready.");
}

main();