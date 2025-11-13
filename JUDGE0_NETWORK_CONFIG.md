# Judge0 Configuration - Network Setup

## Current Configuration

**Judge0 API URL:** `http://10.14.99.65:2358`

This is your local Judge0 instance running on your network.

## Supported Languages

| Language | Language ID | Code Template |
|----------|-------------|---------------|
| Python 3 | 71 | ✅ Available |
| Java | 62 | ✅ Available |
| C++ (GCC) | 54 | ✅ Available |

## Features Implemented

### ✅ Code Execution
- Submit code to Judge0
- Real-time status polling
- Timeout protection (60 seconds max)

### ✅ Input/Output Handling
- **stdin support** - Input field for interactive programs
- **stdout display** - Shows program output
- **stderr display** - Shows error output
- **Compilation errors** - Shows compiler messages

### ✅ Error Handling
- Network connection errors
- Compilation errors with details
- Runtime errors with descriptions
- Timeout detection
- Status checking with retry logic

### ✅ Execution Feedback
- Progress indicators (⏳ Submitting, Processing)
- Success indicators (✅ Output)
- Error indicators (❌ Error)
- Execution statistics (⏱️ Time, 💾 Memory)

## Testing the Setup

### 1. Test Simple Output (Python)
```python
print("Hello from Judge0!")
print("Execution successful!")
```
**Expected:** Output displays in console

### 2. Test With Input (Python)
```python
name = input("Enter your name: ")
age = input("Enter your age: ")
print(f"Hello {name}, you are {age} years old!")
```
**Input to provide:**
```
John
25
```
**Expected:** "Hello John, you are 25 years old!"

### 3. Test Compilation Error (Python)
```python
print("Missing closing quote)
```
**Expected:** Shows syntax error

### 4. Test Runtime Error (Python)
```python
x = 10 / 0
```
**Expected:** Shows ZeroDivisionError

### 5. Test Java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Java is working!");
    }
}
```
**Expected:** "Java is working!"

### 6. Test C++
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "C++ is working!" << endl;
    return 0;
}
```
**Expected:** "C++ is working!"

## Status Codes Reference

| Status ID | Description | How It's Displayed |
|-----------|-------------|-------------------|
| 1 | In Queue | ⏳ In Queue... |
| 2 | Processing | ⏳ Processing... |
| 3 | Accepted | ✅ Output + stats |
| 4 | Wrong Answer | Shows output |
| 5 | Time Limit Exceeded | ⏱️ Timeout message |
| 6 | Compilation Error | ❌ Compilation Error + details |
| 7-12 | Runtime Errors | ❌ Runtime Error + description |
| 13 | Internal Error | ❌ Error message |
| 14 | Exec Format Error | ❌ Error message |

## Troubleshooting

### ❌ "Error submitting code"
**Cause:** Cannot connect to Judge0 server

**Solutions:**
1. Verify Judge0 is running: `curl http://10.14.99.65:2358/about`
2. Check network connectivity
3. Verify firewall isn't blocking port 2358
4. Ensure the IP address is correct

### ❌ "Timeout: Execution took too long"
**Causes:**
- Code has infinite loop
- Code is waiting for input but stdin is empty
- Judge0 worker is overloaded

**Solutions:**
1. Check your code for infinite loops
2. Ensure you've provided stdin input if needed
3. Try submitting again

### ⚠️ Empty Output
**Causes:**
- Code doesn't print anything
- Code crashed before output
- Missing input for interactive programs

**Solutions:**
1. Add print statements to your code
2. Check for runtime errors
3. Provide stdin input if using input(), Scanner, cin

### 🐌 Slow Execution
**Causes:**
- First execution initializes containers
- Network latency
- Judge0 queue is busy

**Solutions:**
- First run is usually slower, subsequent runs are faster
- Wait for the current submission to complete

## Network Information

**Server IP:** 10.14.99.65  
**Port:** 2358  
**Protocol:** HTTP  
**Endpoint:** `/submissions`

## API Details

### Submission Request
```javascript
POST http://10.14.99.65:2358/submissions?base64_encoded=false&wait=false
Content-Type: application/json

{
  "source_code": "print('Hello')",
  "language_id": 71,
  "stdin": ""
}
```

### Status Check Request
```javascript
GET http://10.14.99.65:2358/submissions/{token}?base64_encoded=false&fields=stdout,stderr,status,compile_output,message,time,memory
```

## Best Practices

1. **Always test simple code first** - Verify connection works
2. **Use stdin for interactive programs** - Don't leave it empty
3. **Check compilation errors carefully** - They show exact line numbers
4. **Monitor execution time** - Optimize slow code
5. **Clear output between runs** - Avoid confusion

## Security Notes

⚠️ **Important:**
- Judge0 is running on local network
- No authentication is required (development mode)
- All submissions are visible to the Judge0 server
- Don't submit sensitive code or data

---

**Last Updated:** November 13, 2025  
**Judge0 Version:** 1.13.0 (assumed)  
**Configuration Status:** ✅ Active and Configured
