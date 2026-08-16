from pathlib import Path

from app.rag.chunker import CodeChunker


from app.config.paths import CLONED_REPOSITORIES_DIR

# Use the first cloned repository or default directory
repository_path = next(CLONED_REPOSITORIES_DIR.glob("*"), CLONED_REPOSITORIES_DIR)



print("=" * 60)
print("Repository exists:")
print(repository_path.exists())

print()
print("Repository path:")
print(repository_path)

print()
print("Source files:")
print("=" * 60)


chunker = CodeChunker(
    repository_path
)

files = chunker.get_source_files()

print(
    f"Found {len(files)} source files."
)

for file in files:
    print(file)


print()
print("=" * 60)
print("Creating chunks...")
print("=" * 60)


documents = chunker.chunk_repository()

print(
    f"Created {len(documents)} documents."
)


for document in documents[:5]:

    print()
    print("ID:", document["id"])
    print("FILE:", document["file"])
    print(
        "CONTENT:",
        document["content"][:200]
    )