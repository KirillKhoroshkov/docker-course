package main

import (
    "fmt"
    "math/rand"
)

func main() {
  stone := "\U0001F44A"
  scissors := "\u270C\uFE0F"
  paper := "\u270B"
  choices := []string{stone, scissors, paper}
    roll := rand.Intn(3)

    fmt.Printf("My choice is: %s\n", choices[roll])
}
