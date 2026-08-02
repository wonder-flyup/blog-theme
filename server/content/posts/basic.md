---
title: "basic"
date: "2026-08-01"
description: ""
tags: []
draft: true
category: "tech"
---


# 函数库
## ```c<string.h>```
数组长度读取
```c

#include <stdio.h>
#include <string.h>

int main() {
    char message[] = "Hello, strlen!";
    size_t length = strlen(message);
    
    printf("字符串内容: %s\n", message);
    printf("字符串长度: %zu (不包含结束符'\\0')\n", length);
    
    return 0;
}

字符串内容: Hello, strlen!
字符串长度: 13 (不包含结束符'\0')
%s和%c读入数据的存储格式，存储类型完全一样，只不过%c是逐个读入而%s是一整个读入的，同时%s会自动添加字符串结束符\0,%c需要自己手动添加。
同时在进行字符串之间的比较的时候，不可直接用"="，必须要调用相应函数
```
字符串比较
```c
#include <stdio.h>
#include <string.h>
int main{
    char SourceArr[10]="1002";
    char DesArr[10]="1001";
    strcpy(DesArr,SourceArr);//字符串拷贝
    strcmp(DesArr,SourceArr);//字符串比较
    //int result = strcmp(字符串1, 字符串2)
/*返回值（核心！）：int result = strcmp(字符串1, 字符串2)
result == 0：两个字符串 内容完全相同；
result < 0：字符串 1 < 字符串 2（按 ASCII 码比较，逐个字符直到不同）；
result > 0：字符串 1 > 字符串 2；*/
}
```
## ```c<stdlib.h> <time.h>```
随机数生成(需要调用<time.h>)

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main() {
    srand((unsigned int)time(NULL));
    int num = rand();
    printf("随机数: %d\n", num);
    return 0;
}
``` 
srand(time(NULL)) 利用当前时间作为种子，因为时间一直在变化，所以能保证每次程序运行生成不同的随机数序列。
rand() 生成的是伪随机数，不是真正的随机数，其序列是可预测的。
##```c<ctype.h>```
字母识别
```c
#include <stdio.h>
#include <ctype.h>

int main() {
    char ch1 = 'A';
    char ch2 = '5';
    char ch3 = '!';

    if (isalpha(ch1)) {
        printf("'%c' 是字母。\n", ch1);
    } else {
        printf("'%c' 不是字母。\n", ch1);
    }

    if (isalpha(ch2)) {
        printf("'%c' 是字母。\n", ch2);
    } else {
        printf("'%c' 不是字母。\n", ch2);
    }

    if (isalpha(ch3)) {
        printf("'%c' 是字母。\n", ch3);
    } else {
        printf("'%c' 不是字母。\n", ch3);
    }

    return 0;
}
'A' 是字母。
'5' 不是字母。
'!' 不是字母。
```
isalpha函数会判断给定字符是否为字母，如果为字母，函数会返回一个非零值（表示逻辑为真），而只要不是字母（标点 数字 空格等）就会返回0（表示逻辑为假的）。
```c
#include <stdio.h>
#include <ctype.h>

int main() {
    char ch1 = 'A';
    char ch2 = 'a';
    char ch3 = '1';

    if (isupper(ch1)) {
        printf("'%c' 是大写字母。\n", ch1);
    } else {
        printf("'%c' 不是大写字母。\n", ch1);
    }

    if (isupper(ch2)) {
        printf("'%c' 是大写字母。\n", ch2);
    } else {
        printf("'%c' 不是大写字母。\n", ch2);
    }

    if (isupper(ch3)) {
        printf("'%c' 是大写字母。\n", ch3);
    } else {
        printf("'%c' 不是大写字母。\n", ch3);
    }

    return 0;
}
'A' 是大写字母。
'a' 不是大写字母。
'1' 不是大写字母。
```
isupper函数可以判断给定字符是否为大写字母，如果是，函数会返回一个非零值（表示逻辑为真），若否，即返回0（表示逻辑为假）。
这两个函数具有容错性，即无论输入什么整数（字符的 ASCII 码、数字、甚至负数），函数都会正常执行并返回 0 或非 0 值，不会导致程序崩溃或编译错误。同时，处理单个字符（包括符号、字母、数字）时，必须用单引号包裹，单引号不能省略。否则会违反 C 语言语法，导致编译错误。
# 小知识
## 二维数组
二维数组不能像 ```c void Print2dArray(int a[][], int m, int n);```这样定义。
正确的方式是```c void Print2dArray(int a[][N], int m);```但这样的方式又违背了松耦合的原则，
可以改为```c void Print2dArray(int m, int n, int a[m][n]);```或者是```c int a[M*N]；// 代替 int a2[M][N];寻址办法：a2[i][j]对应一维数组中的a[i*n+j]``` 将其改为一维数组，因为最终处理的时候也是相当于在处理一维数组。
## 排序算法
### 冒泡排序
```c
void BubbleSort(int a[],int n){
    for(int i=0;i<(n-1);i++){
        int temp,i,j;
        for(int j=0;j<n-i-1;j++){
            if(a[j]>a[j+1]){
                temp=a[j];
                a[j]=a[j+1];
                a[j+1]=temp;
            }
        }
    }

}
```
### 选择排序
```c
void SelectSort(int a[],int n){
    int min;
    for( i=0;i<n-1;i++){
        for( j=i+1;j<n-1-i;j++){
            min=i;
            if(a[j]<a[i]){
                min=j;
            }
        }
        temp=a[i];
        a[i]=a[min];
        a[min]=temp;
    }
}
```
### 插入排序
```c
void InsertSort(int a[],int n){
    int i,j,key;
    for(i=1;i<n;i++){
        key=a[i];
        j=i-1;

        while(j>=0&&a[j]>key){
            a[j+1]=a[j];
            j--;
        }
        a[j+1]=key;
    }
}
```
ps:打印整型数组的时候，只能通过遍历来实现打印。
## C24标准
```c 
#define C24_VERSION 202311L
#if __STDC_VERSION__ < C24_VERSION
    #define alignas _Alignas
    #define alignof _Alignof
    #define noreturn _Noreturn
    #define nullptr NULL
    typedef enum{false=0,true=1}bool;
#endif
```

