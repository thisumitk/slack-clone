import { Router, Request, Response } from 'express';
import prisma from '../prisma/client.js';

const router = Router();

router.get(`/api/users`, async function (req:Request, res: Response) {
  
  try {
    const users = await prisma.user.findMany();
    if(!users || users.length === 0){
      res.json({ msg : `No Users Present`});
    }
    else res.json(users);
  } catch(error){console.error(`Error Fetching the users`, error);
  }
});

export default router;
