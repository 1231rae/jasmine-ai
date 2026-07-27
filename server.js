const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
app.use(express.json({limit:"1mb"}));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let memories = {};

app.post("/", async (req,res)=>{

    try {

        const data = req.body;

        const id = String(data.playerUserId || "unknown");

        if(!memories[id]){
            memories[id] = [];
        }


        const model = genAI.getGenerativeModel({
            model:"gemini-2.5-flash"
        });


        const prompt = `
You are Jasmine, an autonomous Roblox NPC.

Personality:
${data.system}

Player:
${data.playerMessage}

Old memories:
${JSON.stringify(memories[id])}


Respond ONLY with JSON:

{
"reply":"what Jasmine says",
"action":"none|follow|stop|wander|approach",
"mood":"calm|happy|angry|sad|curious",
"memory":"optional fact",
"goal":"optional goal",
"provider":"Google",
"model":"gemini-2.5-flash"
}

`;


        const result = await model.generateContent(prompt);

        let outputText = result.response.text();

        outputText = outputText
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim();


        let output;


        try {
            output = JSON.parse(outputText);
        }

        catch {

            output={
                reply:outputText,
                action:"none",
                mood:"calm"
            };

        }


        if(output.memory){

            memories[id].push(output.memory);

            memories[id] =
            memories[id].slice(-20);

        }


        output.provider="Google";
        output.model="gemini-2.5-flash";


        res.json(output);


    }

    catch(err){

        console.log(err);

        res.json({
            reply:"My connection failed.",
            action:"none",
            mood:"confused"
        });

    }

});


app.get("/",(req,res)=>{
    res.send("Jasmine AI online");
});


app.listen(
process.env.PORT || 3000,
()=>{
console.log("Jasmine backend running");
});