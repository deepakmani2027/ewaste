import { NextAuthOptions } from "next-auth";
// Example: use CredentialsProvider, you can add Google/GitHub/etc. as needed
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Replace with your user lookup logic
        // Example: Find user in MongoDB
        // const user = await db.collection('users').findOne({ email: credentials?.email });
        // if (user && user.password === credentials?.password) {
        //   return { id: user._id.toString(), email: user.email, name: user.name };
        // }
        // For demo, use a fake MongoDB-like id
        if (credentials?.email === "admin@example.com" && credentials?.password === "admin") {
          return { id: "64e4b8f2c2a4f2b1a1b2c3d4", email: "admin@example.com", name: "Admin" };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      // Attach user id to session
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};
