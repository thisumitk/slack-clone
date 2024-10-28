/* eslint-disable no-useless-escape */
import prisma from "@repo/db/prisma";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt";
import { z } from "zod";
import { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import jwt from 'jsonwebtoken';

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string()
        .min(8)
        .max(20)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).*$/)
        .refine((password) => !/\s/.test(password), "Password cannot contain whitespace")
});

const signUpSchema = signInSchema.extend({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot exceed 50 characters")
        .trim()
        .refine(name => name.length > 0, "Name cannot be empty"),
});

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Email',
            credentials: {
                name: { label: "Name", type: "text", placeholder: "John Doe" },
                email: { label: "Email", type: "text", placeholder: "example@gmail.com" },
                password: { label: "Password", type: "password" }
            },

            async authorize(credentials) {
                if (!credentials) return null;

                const { email, password, name } = credentials;

                const existingUser = await prisma.user.findFirst({
                    where: { email }
                });

                // Sign In Flow
                if (existingUser) {
                    // Validate signin credentials
                    const parsedCredentials = signInSchema.safeParse({ email, password });
                    if (!parsedCredentials.success) {
                        console.error("Invalid signin input:", parsedCredentials.error);
                        return null;
                    }

                    const passwordValidation = await bcrypt.compare(password, existingUser.password);
                    if (passwordValidation) {
                        const token = jwt.sign(
                            { id: existingUser.id, email: existingUser.email },
                            process.env.JWT_SECRET || 'mysecret',
                            { expiresIn: '1h' }
                        );
                        return {
                            id: existingUser.id.toString(),
                            name: existingUser.name,
                            email: existingUser.email,
                            accessToken: token
                        }
                    }
                    console.error("Invalid password for user:", email);
                    return null;
                }

                // Sign Up Flow
                try {
                    // Validate signup credentials including name
                    const parsedCredentials = signUpSchema.safeParse({ email, password, name });
                    if (!parsedCredentials.success) {
                        console.error("Invalid signup input:", parsedCredentials.error);
                        return null;
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);
                    const user = await prisma.user.create({
                        data: {
                            name: name,
                            email: email,
                            password: hashedPassword
                        }
                    });
                    const token = jwt.sign(
                        { id: user.id, email: user.email },
                        process.env.JWT_SECRET || 'mysecret',
                        { expiresIn: '1h' }
                    );
                    return {
                        id: user.id.toString(),
                        name: user.name,
                        email: user.email,
                        accessToken: token
                    }
                } catch (e) {
                    console.error(e);
                }

                return null
            }
        })
    ],

    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: User }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.accessToken = user.accessToken
            }
            return token;
        },
        async session({ token, session }: { token: JWT; session: Session }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.accessToken = token.accessToken as string;
                console.log(session);
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/signin',
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60,
    },
}