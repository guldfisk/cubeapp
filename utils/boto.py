from __future__ import annotations

import io
import typing as t

from botocore.client import BaseClient


class MultipartUpload(t.IO[bytes]):
    MIN_PART_SIZE = int(5 * 2 ** 20)

    def __init__(
        self,
        client: BaseClient,
        *,
        file_ref: t.Optional[str] = None,
        bucket: t.Optional[str] = None,
        key: t.Optional[str] = None,
        part_size: int = MIN_PART_SIZE,
        acl: str = 'private',
    ):
        if file_ref:
            self._bucket, self._key = file_ref.split('/', 1)
        elif bucket is None or key is None:
            raise ValueError('Must specify bucket/key')
        else:
            self._bucket = bucket
            self._key = key

        assert part_size >= self.MIN_PART_SIZE

        self._part_size = part_size
        self._client = client
        self._acl = acl

        self._multipart_upload_id: t.Optional[t.Union[str, int]] = None
        self._buffer = io.BytesIO()
        self._parts = []
        self._closed = False
        self._head = 0

    def open(self) -> None:
        self._multipart_upload_id = self._client.create_multipart_upload(
            Bucket = self._bucket,
            Key = self._key,
            ACL = self._acl,
        )['UploadId']

    def fileno(self) -> int:
        raise NotImplemented()

    def flush(self) -> None:
        pass

    def isatty(self) -> bool:
        raise NotImplemented()

    def read(self, n: int = ...) -> bytes:
        raise NotImplemented()

    def readable(self) -> bool:
        return False

    def readline(self, limit: int = ...) -> bytes:
        raise NotImplemented()

    def readlines(self, hint: int = ...) -> t.List[bytes]:
        raise NotImplemented()

    def seek(self, offset: int, whence: int = ...) -> int:
        raise NotImplemented()

    def seekable(self) -> bool:
        return False

    def tell(self) -> int:
        return self._head

    def truncate(self, size: t.Optional[int] = ...) -> int:
        raise NotImplemented()

    def writable(self) -> bool:
        return True

    def writelines(self, lines: t.Iterable[bytes]) -> None:
        for ln in lines:
            self.write(ln + b'\n')

    def __next__(self) -> bytes:
        raise NotImplemented()

    def __iter__(self) -> t.Iterator[bytes]:
        raise NotImplemented()

    def closed(self) -> bool:
        return self._closed

    def abort(self) -> None:
        self._client.abort_multipart_upload(
            Bucket = self._bucket,
            Key = self._key,
            UploadId = self._multipart_upload_id,
        )
        self._closed = True

    def __enter__(self) -> MultipartUpload:
        self.open()
        return self

    def _flush_to_part(self) -> None:
        if not self._buffer.tell():
            return

        self._buffer.seek(0)
        part = self._client.upload_part(
            Body = self._buffer.read(self._part_size),
            Bucket = self._bucket,
            Key = self._key,
            UploadId = self._multipart_upload_id,
            PartNumber = len(self._parts) + 1,
        )
        self._buffer = io.BytesIO()
        self._parts.append(
            {
                "PartNumber": len(self._parts) + 1,
                "ETag": part["ETag"],
            }
        )

    def write(self, s: bytes) -> None:
        self._head += len(s)
        remaining = self._part_size - self._buffer.tell()
        if len(s) > remaining:
            self._buffer.write(s[:remaining])
            self._flush_to_part()
            self.write(s[remaining:])
        else:
            self._buffer.write(s)

    def close(self):
        self._flush_to_part()
        self._client.complete_multipart_upload(
            Bucket = self._bucket,
            Key = self._key,
            UploadId = self._multipart_upload_id,
            MultipartUpload = {"Parts": self._parts}
        )
        self._closed = True

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.abort()
        else:
            self.close()
