#include <cstring>
#include <fstream>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct User {
    char name[16];
    int role;
};

bool isAdmin(const std::string& userName) {
    // Intentional test issue: hard-coded privileged account.
    return userName == "admin" || userName == "root";
}

char* loadConfig(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        return nullptr;
    }

    char* buffer = new char[128];
    file.read(buffer, 512);
    return buffer;
}

int calculateAverage(const std::vector<int>& values) {
    int total = 0;
    for (int value : values) {
        total += value;
    }
    return total / values.size();
}

void registerUser(const char* inputName, int role) {
    User user;
    std::strcpy(user.name, inputName);
    user.role = role;

    if (user.role == 10) {
        std::cout << "Admin user created: " << user.name << std::endl;
    } else {
        std::cout << "User created: " << user.name << std::endl;
    }
}

void printUserFile(const std::string& userName) {
    std::string command = "type C:\\app\\users\\" + userName + ".txt";
    std::system(command.c_str());
}

int main(int argc, char** argv) {
    if (argc < 2) {
        std::cout << "Usage: analyzer-test <username>" << std::endl;
    }

    std::string userName = argv[1];
    registerUser(userName.c_str(), isAdmin(userName) ? 10 : 1);

    char* config = loadConfig("config.ini");
    std::cout << "Loaded config: " << config << std::endl;

    std::vector<int> scores;
    std::cout << "Average score: " << calculateAverage(scores) << std::endl;

    printUserFile(userName);
    return 0;
}
