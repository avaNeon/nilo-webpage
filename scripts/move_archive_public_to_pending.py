"""Move archived media from MinIO public/ to pending/.

Reads video_info_file_archive + video_info_archive from MySQL, then for each
baseKey/cover still under public/, copies the object tree to pending/ and
removes the public/ originals (same semantics as storage moveDirectory).
"""

from __future__ import annotations

import pymysql
from minio import Minio
from minio.commonconfig import CopySource
from minio.deleteobjects import DeleteObject
from minio.error import S3Error

MYSQL = dict(
    host="rocky16",
    port=3306,
    user="root",
    password="mysql",
    database="nilo",
    charset="utf8mb4",
)

MINIO = dict(
    endpoint="rocky13:9000",
    access_key="spring-application",
    secret_key="cat-tOm!uNIon%heLLo(WalLeT?derIVed#8910*",
    secure=False,
)

VIDEO_BUCKET = "nilo-video"
IMAGE_BUCKET = "nilo-image"


def thumb_key(cover: str) -> str:
    base, ext = cover.rsplit(".", 1)
    return f"{base}_thumb.{ext}"


def list_keys(client: Minio, bucket: str, prefix: str) -> list[str]:
    return [
        o.object_name
        for o in client.list_objects(bucket, prefix=prefix, recursive=True)
    ]


def object_exists(client: Minio, bucket: str, name: str) -> bool:
    try:
        client.stat_object(bucket, name)
        return True
    except S3Error as e:
        if e.code in ("NoSuchKey", "NoSuchObject"):
            return False
        raise


def move_directory(client: Minio, bucket: str, src_root: str, dest_root: str) -> int:
    """Copy all objects under src_root to dest_root, then delete sources."""
    src_root = src_root.rstrip("/")
    dest_root = dest_root.rstrip("/")
    src_keys = list_keys(client, bucket, src_root + "/")
    if not src_keys:
        dest_keys = list_keys(client, bucket, dest_root + "/")
        if dest_keys:
            print(f"  skip (already at dest): {dest_root} ({len(dest_keys)} objs)")
            return 0
        print(f"  MISS both sides: {src_root}")
        return 0

    moved = 0
    for src in src_keys:
        rel = src[len(src_root) :]  # includes leading /
        dest = dest_root + rel
        if not object_exists(client, bucket, dest):
            client.copy_object(
                bucket,
                dest,
                CopySource(bucket, src),
            )
            moved += 1
        else:
            print(f"  dest exists, skip copy: {dest}")

    # delete sources after all copies succeed
    errors = list(
        client.remove_objects(bucket, [DeleteObject(k) for k in src_keys])
    )
    if errors:
        raise RuntimeError(f"delete failed under {src_root}: {errors[:3]}")

    print(f"  moved {len(src_keys)} objects ({moved} copied): {src_root} -> {dest_root}")
    return len(src_keys)


def move_object(client: Minio, bucket: str, src: str, dest: str) -> bool:
    if object_exists(client, bucket, dest):
        if object_exists(client, bucket, src):
            client.remove_object(bucket, src)
            print(f"  dest exists, removed src: {src}")
        else:
            print(f"  already at dest: {dest}")
        return False
    if not object_exists(client, bucket, src):
        print(f"  MISS: {src}")
        return False
    client.copy_object(bucket, dest, CopySource(bucket, src))
    client.remove_object(bucket, src)
    print(f"  moved object: {src} -> {dest}")
    return True


def main() -> None:
    conn = pymysql.connect(**MYSQL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT file_path FROM video_info_file_archive "
                "WHERE file_path IS NOT NULL AND file_path <> ''"
            )
            video_base_keys = [r[0] for r in cur.fetchall()]
            cur.execute(
                "SELECT DISTINCT video_cover FROM video_info_archive "
                "WHERE video_cover IS NOT NULL AND video_cover <> ''"
            )
            covers = [r[0] for r in cur.fetchall()]
    finally:
        conn.close()

    client = Minio(**MINIO)
    print(f"archive video baseKeys: {len(video_base_keys)}")
    print(f"archive covers: {len(covers)}")

    total_video = 0
    for bk in video_base_keys:
        print(f"\n[VIDEO] {bk}")
        total_video += move_directory(
            client, VIDEO_BUCKET, f"public/{bk}", f"pending/{bk}"
        )

    print("\n=== COVERS ===")
    for cover in covers:
        for plain in (cover, thumb_key(cover)):
            move_object(
                client,
                IMAGE_BUCKET,
                f"public/{plain}",
                f"pending/{plain}",
            )

    print("\n=== VERIFY ===")
    for bk in video_base_keys:
        pub = list_keys(client, VIDEO_BUCKET, f"public/{bk}/")
        pen = list_keys(client, VIDEO_BUCKET, f"pending/{bk}/")
        print(f"{bk}: public={len(pub)} pending={len(pen)}")
        master = f"pending/{bk}/master.m3u8"
        print(f"  master exists: {object_exists(client, VIDEO_BUCKET, master)}")

    for cover in covers:
        for plain in (cover, thumb_key(cover)):
            print(
                f"{plain}: public={object_exists(client, IMAGE_BUCKET, f'public/{plain}')} "
                f"pending={object_exists(client, IMAGE_BUCKET, f'pending/{plain}')}"
            )

    print(f"\nDone. video objects touched under trees totaling listed moves: {total_video}")


if __name__ == "__main__":
    main()
