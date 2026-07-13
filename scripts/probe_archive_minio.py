from minio import Minio
from minio.error import S3Error

client = Minio(
    "rocky13:9000",
    access_key="spring-application",
    secret_key="cat-tOm!uNIon%heLLo(WalLeT?derIVed#8910*",
    secure=False,
)

video_keys = [
    "20260618/7a64132a32f7566beaa32a01285e6b",
    "20260618/1dc2b11a13c6a95bca5af7ca2cda4d",
]
covers = [
    "20260618/fJTSkOsx6DxvNOTFM3ME6megTVxSkv.jpg",
    "20260618/bNWDtUcrjSK3Ov2oaf6C50DWApf7Wt.jpg",
]


def list_prefix(bucket, prefix):
    return [o.object_name for o in client.list_objects(bucket, prefix=prefix, recursive=True)]


print("=== VIDEO ===")
for bk in video_keys:
    for pref in ("public/", "pending/", "tmp/"):
        keys = list_prefix("nilo-video", f"{pref}{bk}")
        print(f"{pref}{bk}: {len(keys)} objects")
        for k in keys[:8]:
            print(f"  - {k}")
        if len(keys) > 8:
            print(f"  ... +{len(keys) - 8} more")

print("\n=== IMAGE COVERS ===")
for cover in covers:
    base, ext = cover.rsplit(".", 1)
    thumb = f"{base}_thumb.{ext}"
    for plain in (cover, thumb):
        for pref in ("public/", "pending/", "tmp/"):
            name = f"{pref}{plain}"
            try:
                st = client.stat_object("nilo-image", name)
                print(f"FOUND {name} size={st.size}")
            except S3Error as e:
                if e.code in ("NoSuchKey", "NoSuchObject"):
                    print(f"MISS  {name}")
                else:
                    print(f"ERR   {name}: {e}")
