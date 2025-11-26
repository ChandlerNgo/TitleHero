import os
import boto3
from tqdm import tqdm
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

# CONFIGURATION
S3_BUCKET   = ''         # your bucket name
DEST_PREFIX = 'Washington/'                  # S3 folder (prefix)
BASE_DIR    = r'F:\HFImages\WashingtonTx'    # base directory path
MAX_WORKERS = 256

s3_client = boto3.client('s3')

def upload_file_to_s3(file_path, s3_key):
    """Upload a single file to S3."""
    try:
        s3_client.upload_file(file_path, S3_BUCKET, s3_key)
        return (file_path, None)
    except Exception as e:
        return (file_path, e)

def find_files_to_upload(blu_path):
    """Recursively find all files under blu_path (excluding .txt optional)."""
    files_to_upload = []
    for root, dirs, files in os.walk(blu_path):
        dirs[:] = [d for d in dirs if d.lower() != 'bluewc001']  # skip that folder if needed
        for file in files:
            # keep this if you want to skip text files; remove if you want literally *everything*
            if not file.lower().endswith('.txt'):
                full_path = os.path.join(root, file)
                files_to_upload.append(full_path)
    return files_to_upload

def upload_files_for_folder(folder_path):
    """Upload all files in BLU subfolder to S3 under Washington/ (flat)."""
    blu_path = os.path.join(folder_path, 'BLU')
    if not os.path.isdir(blu_path):
        print(f"Skipping {folder_path}: 'BLU' folder not found")
        return

    print(f"\nScanning for files in {blu_path} ...")
    files_to_upload = find_files_to_upload(blu_path)
    if not files_to_upload:
        print(f"No files found in {blu_path}")
        return

    print(f"Found {len(files_to_upload)} files. Starting upload...\n")

    # Build flat keys under DEST_PREFIX with collision handling
    files_and_keys = []
    seen = {}  # basename -> count
    for file_path in files_to_upload:
        base = os.path.basename(file_path)  # no subfolders in the key
        if base in seen:
            seen[base] += 1
            name, ext = os.path.splitext(base)
            key_name = f"{name}_{seen[base]}{ext}"  # e.g., file_2.tif
        else:
            seen[base] = 1
            key_name = base

        s3_key = f"{DEST_PREFIX}{key_name}"
        files_and_keys.append((file_path, s3_key))

    # Upload with a progress bar; write messages to the same stream
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(upload_file_to_s3, fp, key): (fp, key) for fp, key in files_and_keys}
        with tqdm(total=len(futures),
                  desc=f"Uploading {os.path.basename(folder_path)}",
                  unit="file",
                  file=sys.stdout,
                  leave=True) as pbar:
            for future in as_completed(futures):
                (file_path, key) = futures[future]
                _, error = future.result()
                if error:
                    tqdm.write(f"Failed to upload {file_path} -> s3://{S3_BUCKET}/{key}: {error}",
                               file=sys.stdout)
                pbar.update(1)

    print(f"Upload complete for {os.path.basename(folder_path)}.\n")

def main():
    all_folders = [f for f in os.listdir(BASE_DIR) if os.path.isdir(os.path.join(BASE_DIR, f))]
    if not all_folders:
        print(f"No folders found in base directory: {BASE_DIR}")
        return

    print(f"Found {len(all_folders)} folders to process.\n")

    for folder_name in tqdm(all_folders, desc="Processing folders", unit="folder"):
        folder_path = os.path.join(BASE_DIR, folder_name)
        upload_files_for_folder(folder_path)

if __name__ == '__main__':
    main()