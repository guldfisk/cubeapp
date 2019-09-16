import time

from asgiref.sync import async_to_sync
from celery import shared_task, Task
from channels.layers import get_channel_layer


class CallbackTask(Task):

    def on_success(self, retval, task_id, args, kwargs):
        async_to_sync(get_channel_layer())(
            f'distributor_{kwargs["patch_pk"]}',
            {
                'type': 'distribution_pdf_update',
                'url': 'https://phdk.fra1.digitaloceanspaces.com/phdk/distributions/distribution.pdf',
            },
        )

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        pass


@shared_task(base=CallbackTask)
def generate_distribution_pdf(patch_pk: int):
    print('ok begin task')
    time.sleep(3)