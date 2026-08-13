# ╔══════════════════════════════════════════════════════════════╗
# ║              VectorDB Engine — Makefile                      ║
# ║  Usage:  make          → build server                        ║
# ║          make clean    → remove binary                       ║
# ║          make rebuild  → clean + build                       ║
# ╚══════════════════════════════════════════════════════════════╝

CXX      := g++
CXXFLAGS := -std=c++17 -O2 -Wall -Wextra -Wno-unused-parameter
DEFS     := -DCPPHTTPLIB_OPENSSL_SUPPORT
LIBS     := -lpthread -lssl -lcrypto
INCLUDES := -I./server

SRC      := server/main.cpp
BIN      := db

.PHONY: all clean rebuild

all: $(BIN)

$(BIN): $(SRC) server/httplib.h
	@echo "  Compiling VectorDB server..."
	$(CXX) $(CXXFLAGS) $(DEFS) $(INCLUDES) -o $@ $< $(LIBS)
	@echo "  ✓  Built: ./$(BIN)"

clean:
	@rm -f $(BIN)
	@echo "  ✓  Cleaned"

rebuild: clean all
