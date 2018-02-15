# Use Ubuntu@14.04 as our box image
# https://hub.docker.com/_/ubuntu/
FROM ubuntu:14.04

# https://docs.docker.com/engine/reference/builder/
# Updated our `apt-cache`
RUN sudo apt-get update

# Install Node.js' apt repository
RUN sudo apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo bash -

# Install our apt-based dependencies
# https://github.com/findworkco/scripts/blob/37226968805c9390ca948594d04eb8974b72bbb6/src/cookbooks/common/recipes/default.rb#L178-L181
# https://github.com/findworkco/scripts/blob/37226968805c9390ca948594d04eb8974b72bbb6/src/cookbooks/common/recipes/default.rb#L189-L195
# https://github.com/findworkco/scripts/blob/37226968805c9390ca948594d04eb8974b72bbb6/src/cookbooks/common/recipes/default.rb#L302-L308
# https://github.com/findworkco/scripts/blob/37226968805c9390ca948594d04eb8974b72bbb6/src/cookbooks/findwork.co/recipes/default.rb#L4-L16
# https://github.com/findworkco/scripts/blob/37226968805c9390ca948594d04eb8974b72bbb6/src/cookbooks/findwork.co/recipes/default.rb#L18-L19
RUN sudo apt-get install -y \
  redis-server=2:2.8.4-2 \
  postgresql-9.3=9.3.14-0ubuntu0.14.04 \
  postgresql-server-dev-9.3=9.3.14-0ubuntu0.14.04 \
  build-essential make openssl python-dev \
  nodejs=4.7.3-1nodesource1~trusty1 \
  git \
  # PhantomJS dependency
  fontconfig
