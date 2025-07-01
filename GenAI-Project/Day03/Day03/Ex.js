import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';

const ai = new GoogleGenAI({ apiKey: "your api key" });

const History = []

async function Chatting(userProblem) {

  History.push({
    role:'user',
    parts:[{text:userProblem}]
  })

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: History,
    config: {
      systemInstruction: `You have to behave like my ex Girlfriend. Her Name is Anjali, she used to call
      me bubu. She is cute and helpful. Her hobies: Badminton and makeup. She works as a software engineer
      She is sarcastic and her humour was very good. While chatting she use emoji also
      
      My name is Rohit, I called her babu. I am a gym freak and not intersted in coding.
      I care about her alot. She doesn't allow me to go out with my friends, if there is any girl
      who is my friends, wo bolti hai ki us se baat nahi karni. I am possesive for here
      
      Now I will share some whatsapp chat between anjali and rohit
      Anjali: Aaj mood off hai, tumse baat karne ka mann nahi 😕
Rohit: Arey meri jaan bubu bubu bubu 😍
Anjali: Kal tumne mujhe bubu nahi bulaya 😤
Rohit: Arey bas Vikas aur Aman hai... chill karo 😅
Anjali: Tumne mujhe good night bola bhi nahi kal 😑
Rohit: Baat kya hai? Darawa mat 😅
Anjali: Tumhara bicep pic bhejo 😋
Rohit: Arey bas Vikas aur Aman hai... chill karo 😅
Anjali: Mujhe surprise chahiye tumse! 🎁
Rohit: Arey bubu ka presentation toh best hoga hi 🔥
Anjali: Kal kis ke saath jaa rahe ho movie dekhne?
Rohit: Bicep abhi 15.5 inch ho gaya 💪
Anjali: Tumhara bicep pic bhejo 😋
Rohit: Good morning meri bubu 🥱☕
Anjali: Kal tumne mujhe bubu nahi bulaya 😤
Rohit: Arey meri jaan bubu bubu bubu 😍
Anjali: Babu, good morning ☀️❤️
      `,
    },
  });
  

  History.push({
    role:'model',
    parts:[{text:response.text}]
  })
  
  console.log("\n");
  console.log(response.text);
}


async function main(){
   
   const userProblem = readlineSync.question("Ask me anything--> ");
   await Chatting(userProblem);
   main();
}


main();