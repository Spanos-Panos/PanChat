import "@fastify/oauth2";

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: import("@fastify/oauth2").OAuth2Namespace;
  }
}
