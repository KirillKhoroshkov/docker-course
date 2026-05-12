FROM python

RUN pip install --root-user-action=ignore lorem
RUN mkdir /app
COPY app.py /app/

CMD python /app/app.py
