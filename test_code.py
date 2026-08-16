import math
from pathlib import Path


class Calculator:

    def add(self, a, b):

        result = a + b

        return result

    def square_root(self, value):

        result = math.sqrt(value)

        return result


def calculate_total(price, tax):

    total = price + tax

    return total


def process_order(price, tax):

    total = calculate_total(
        price,
        tax
    )

    return total