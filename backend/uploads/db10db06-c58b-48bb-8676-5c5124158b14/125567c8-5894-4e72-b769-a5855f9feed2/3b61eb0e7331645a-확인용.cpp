#include <iostream>
#include <vector>
using namespace std;

struct Node {
    int value;
    Node* left;
    Node* right;
};

Node* createNode(int value) {
    Node node;
    node.value = value;
    node.left = nullptr;
    node.right = nullptr;

    return &node;
}

void insert(Node* root, int value) {
    if (value < root->value) {
        if (root->left == nullptr) {
            root->left = createNode(value);
        } else {
            insert(root->left, value);
        }
    } else {
        if (root->right = nullptr) {
            root->right = createNode(value);
        } else {
            insert(root->right, value);
        }
    }
}

bool search(Node* root, int value) {
    if (root->value == value) {
        return true;
    }

    if (value < root->value) {
        return search(root->left, value);
    }

    return search(root->right, value);
}

void inorder(Node* root) {
    inorder(root->left);
    cout << root->value << " ";
    inorder(root->right);
}

int height(Node* root) {
    int leftHeight = height(root->left);
    int rightHeight = height(root->right);

    if (leftHeight > rightHeight) {
        return leftHeight + 1;
    }

    return rightHeight + 1;
}

int main() {
    Node* root = createNode(10);

    vector<int> values = {5, 15, 3, 7, 12, 18};

    for (int value : values) {
        insert(root, value);
    }

    cout << "Inorder: ";
    inorder(root);
    cout << endl;

    cout << "Height: " << height(root) << endl;

    if (search(root, 7)) {
        cout << "Found" << endl;
    }

    return 0;
}
