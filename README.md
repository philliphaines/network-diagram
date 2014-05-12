# Simple AWS Network Diagram Generator

## How to use

Clone the repo then run the following commands using the AWS command line
tools.

```
export AWS_DEFAULT_REGION=us-east-1; aws ec2 describe-security-groups > groups.json
export AWS_DEFAULT_REGION=us-east-1; aws ec2 describe-instances > instances.json
```

Copy the `.json` files into the `data` directory.

To view the diagram run the simple Python web server and open http://localhost:8000/
in your browser.

```
python -m SimpleHTTPServer 8000
```
