import fetch from 'node-fetch'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 8080

app.listen(PORT, ()=> {console.log(`Server listening on port ${PORT}`)})
app.use(cors({
  origin: '*'
}))

app.get('/mockups', async (req,res)=>{
    console.log('Receved Request')
    const fetchOptions = {
    method: 'POST', // Include the HTTP method
    headers: {
        'api_key': '89a76258-2d04-438f-8a8a-cb1e68922065',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    body: JSON.stringify({
        "nr": 520,
        "image_type": "jpeg",
        "layer_inputs": [
        {
            "id": "juqu6evm8k4dtcu835p",
            "data": 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=600',
            "crop": {
            "x": 0,
            "y": 0,
            "width": 1172,
            "height": 1168
            },
            "checked": true
        },
        {
            "id": "ea18e8f6-1e41-4a5e-bbe2-a469e2fea45d",
            "checked": true,
            "color": {
            "red": 254,
            "green": 186,
            "blue": 227
            }
        }
        ]
    })
    };

    const url = 'https://api.mediamodifier.com/v2/mockup/render';

    try {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            const errorResponse = await response.json()
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorResponse}`);
        }
        const mockup = await response.json();
        console.log('Heres the data', mockup);
        return res.json({url: mockup.url})
    } catch (error) {
        console.error('Error posting data:', error);
       res.json({error});
    }
})

app.get('/printful-mockups', async (req,res)=>{
    // const body = req.body
    console.log('Received Request')
    const fetchOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer 68rqPPLBt445UqlMJiLYzguZr411OR2j0LLO9Q92',
          'X-PF-Store-Id': '8893037'
        },
        body: JSON.stringify({
          "variant_ids": [
            4012,
            4013,
            4014,
            4017,
            4018,
            4019
          ],
          "format": "jpg",
          "files": [
            {
              "placement": "front",
              "image_url": "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=600g",
              "position": {
                "area_width": 1800,
                "area_height": 2400,
                "width": 1800,
                "height": 1800,
                "top": 300,
                "left": 0
              }
            },
            {
              "placement": "back",
              "image_url": "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=600",
              "position": {
                "area_width": 1800,
                "area_height": 2400,
                "width": 1800,
                "height": 1800,
                "top": 300,
                "left": 0
              }
            }
          ]
        })
    }
    const pollingOptions = {
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer 68rqPPLBt445UqlMJiLYzguZr411OR2j0LLO9Q92',
          'X-PF-Store-Id': '8893037'
        },
    }
    let isProcessed = false
    let generationResult;
    try {
        const response = await fetch('https://api.printful.com/mockup-generator/create-task/71', fetchOptions)
        if(!response.ok){
            const responseError = await response.json()
            console.log(responseError)
            throw new Error('Error Creating Mockup')
        }
        const responseObject = await response.json()
        console.log('Heres the task_key:', responseObject.result.task_key)
        const taskKey = responseObject.result.task_key
        await new Promise((resolve,_)=>{
            setTimeout(()=>{
                resolve()
            }, 30000)
        })
        while(!isProcessed){
            const pollResponse = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskKey}`,pollingOptions)
            if(!pollResponse.ok){
                throw new Error('Error Fetching Polling API')
            }
            const pollObject = await pollResponse.json()
            console.log('Heres the poll object', pollObject)

            if(pollObject.result.status === 'completed'){
                isProcessed = true
                generationResult = pollObject
                console.log('Mockup Has Been Generated')
            }else{
                await new Promise((resolve,_)=>{
                    setTimeout(()=>{
                        resolve()
                    }, 30000)
                })
            }
        }
        console.log(generationResult)
        res.json({result: generationResult})
    } catch (error) {
        console.error(error)
        res.json({error}).status(500)
    }
})

app.get('/store-id', async(req,res)=>{
    const url = 'https://api.printful.com/stores'; // Endpoint to get store information

    const fetchOptions = {
        method: "GET",
        headers: {
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer NBvQgZTGG8ZC3heGlZJeXj2ZFt1PHLVFIPwYUcP1' // Replace with your actual OAuth token
        }
    }
    try {
        const response = await fetch(url, fetchOptions);
    
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching store information:', error);
    }
})