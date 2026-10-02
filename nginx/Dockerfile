# Use the official, ultra-lightweight Nginx image based on Alpine Linux.
# Pin it to avoid update breakages.
FROM nginx:1.31-alpine3.23

# Install OpenSSL to generate security keys and certificates
# and tzdata to set timezone and have logs at the correct time.
# The --no-cache flag prevents storing temporary installation files to keep the image small
RUN apk add --no-cache openssl tzdata

# Set timezone to France.
RUN ln -s /usr/share/zoneinfo/Europe/Paris /etc/localtime

# Create the directory where Nginx will look for SSL files
RUN mkdir -p /etc/nginx/ssl

# Generate a self-signed SSL certificate and its private key:
# -req -x509: creates a self-signed certificate instead of a certificate request
# -nodes: (no DES) does not encrypt the private key with a password (required so Nginx can start automatically)
# -out / -keyout: specifies the output paths for the certificate (.crt) and the private key (.key)
# -subj: pre-fills the certificate identity fields (Country, State, Location, Org, and your intra UID)
RUN openssl req -x509 -nodes \
    -out /etc/nginx/ssl/transcendence.crt \
    -keyout /etc/nginx/ssl/transcendence.key \
    -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=localhost.fr/UID=cafavier"

# Inform Docker that the container listens on port 443 (the standard port for secure HTTPS)
EXPOSE 443

# Replace the default Nginx configuration file with our custom setup
# Your 'nginx.conf' will use this to bind port 443 to the SSL files generated above
COPY conf/nginx.conf /etc/nginx/conf.d/default.conf
