# Public ECR mirror of the official Node image (avoids Docker Hub pull limits in CodeBuild)
FROM public.ecr.aws/docker/library/node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 5000
CMD ["node", "server.js"]
