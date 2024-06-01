import express from 'express'
import cors from 'cors'
import sharp from 'sharp'
import axios from 'axios'

const PORT = 8080
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true}))
app.use(cors({
  origin: '*'
}))

app.listen(PORT, ()=> {console.log(`Server listening on port ${PORT}`)})

app.post('/mediamodifier-mockups', async (req,res)=>{
    const {src} = req.body
    console.log('Received', src)

    const newUrl = modifyUrl(src)
    console.log('Heres the new url', newUrl)

    const url = 'https://api.mediamodifier.com/v2/mockup/render';

    const imageType = await getImageType(src)
    console.log('The image is type:', imageType)

    // if (body.src.startsWith('//')) {
    //     newUrl = 'https:' + body.src;  
    // } else if (!body.src.startsWith('http://') && !body.src.startsWith('https://')) {
    //     newUrl = 'https://' + body.src; 
    // }else{
    //     newUrl = body.src
    // }

    try {
        const metadata = await getImageDimensions(newUrl)
        const fetchOptions = {
        method: 'POST',  
        headers: {
            'api_key': '89a76258-2d04-438f-8a8a-cb1e68922065',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            "nr": 520,
            "image_type": imageType? imageType : 'jpeg',
            "layer_inputs": [
            {
                "id": "juqu6evm8k4dtcu835p",
                "data": newUrl,
                "crop": {
                "x": 0,
                "y": 0,
                "width": metadata.width,
                "height": metadata.height
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

app.post('/printful-mockups', async (req,res)=>{
    const body = req.body
    console.log('Received', body)
    let newUrl;


    if (body.src.startsWith('//')) {
        newUrl = 'https:' + body.src;  
    } else if (!body.src.startsWith('http://') && !body.src.startsWith('https://')) {
        newUrl = 'https://' + body.src; 
    }else{
        newUrl = body.src
    }

    console.log('heres the new url', newUrl)

    let isProcessed = false
    let generationResult;
    const maxWidth = 1800
    const maxHeight = 2400
    const productId = 362
    const variantId = 10288

    try {
        const metadata = await getImageDimensions(newUrl)
        const fetchOptions = {
            method: "POST",
            headers: {
              'Content-Type': 'application/json', 
              'Authorization': 'Bearer 68rqPPLBt445UqlMJiLYzguZr411OR2j0LLO9Q92',
              'X-PF-Store-Id': '8893037'
            },
            body: JSON.stringify({
              "variant_ids": [variantId],
              "format": "jpg",
              "files": [
                {
                  "placement": "front",
                  "image_url": `${newUrl}`,
                  "position": {
                    "area_width": maxWidth,
                    "area_height": maxHeight,
                    "width": metadata.width > maxWidth ? maxWidth : metadata.width,
                    "height": metadata.height > maxHeight ? maxHeight : metadata.height,
                    "top": metadata.height < maxHeight ? (maxHeight - metadata.height)/2 : 0,
                    "left": metadata.width < maxWidth ? (maxWidth - metadata.width)/2 : 0
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
        const response = await fetch(`https://api.printful.com/mockup-generator/create-task/${productId}`, fetchOptions);
        if(!response.ok){
            const responseError = await response.json()
            console.log(responseError)
            throw new Error('Error Creating Mockup, Try Again')
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
        res.json({result: generationResult.result.mockups[0].mockup_url}).status(201)

    } catch (error) {
        console.error(error)
        res.json({error}).status(500)
    }
}) 


async function getImageDimensions(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Convert the response to an ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();

        // Convert the ArrayBuffer to a Buffer
        const imageBuffer = Buffer.from(arrayBuffer);

        const metadata = await sharp(imageBuffer).metadata();

        const width = metadata.width;
        const height = metadata.height;

        return { width, height };
    } catch (error) {
        console.error('Error fetching or processing image:', error);
        throw error;
    }
}
function modifyUrl(url){
    let newUrl

    if (url.startsWith('//')) {
        newUrl = 'https:' + url;  
    }else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        newUrl = 'https://' + url; 
    }else{
        newUrl = url
    }

    return newUrl
}
async function getImageType(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }      
      const contentType = response.headers.get('Content-Type');
      if (contentType) {
        return contentType;
      }
      
    } catch (error) {
      console.error('Error fetching image type');
      return null;
    }
}