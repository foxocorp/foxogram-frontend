FROM node:latest AS builder

ARG NODE_ENV

WORKDIR /workspace

# Copy package manifest.
COPY package.json ./package.json

# Cache depedencies.
RUN npm install --include=dev

# Copy sources.
COPY . ./

# Generate static site.
RUN npm run build

FROM busybox:stable

# Write httpd configuration.
RUN <<EOF cat >> /var/www/httpd.conf
H:/var/www/html
I:index.html
E404:index.html
EOF

# Copy resulted build.
COPY --from=builder /workspace/dist /var/www/html

ENTRYPOINT [ "/bin/httpd" ]
CMD [ "-f", "-p80", "-c/var/www/httpd.conf" ]
