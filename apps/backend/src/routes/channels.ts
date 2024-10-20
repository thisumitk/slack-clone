import { Router, Request, Response } from 'express';
import prisma from '../prisma/client.js';

const router = Router();

router.post('/api/channels', async function ( req : Request, res: Response){

  const { name } = req.body;

  try {

    const newChannel = await prisma.channel.create({
      data: {name},
    })
    res.json(newChannel);
  } catch(error){

    console.error(`ERROR creating the channel`, error);
    res.status(500).json({error : `failed to create channel`});
  }
});


router.get(`/api/channels`, async function (req:Request, res:Response) {
  
  try {
    const channels = await prisma.channel.findMany();
    if(!channels || channels.length === 0){
      res.json({message : 'No Channels Found'});
    }
    else res.json(channels);
  } catch(error){

    console.error('Error fetching the channels', error);
    res.status(500).json({error : `failed to fetch channels`});
  }
});


export default router;