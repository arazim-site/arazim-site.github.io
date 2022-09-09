import sys


R = C = F = N = B = T = None

class Location(object):
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Trip(object):
    def __init__(self, id, a, b, x, y, s, f):
        self.id = id
        self.start = Location(a, b)
        self.end = Location(x, y)
        self.s = s
        self.f = f

def main(*argv):
    global R, C, F, N, B, T

    in_file = 'a.in'
    out_file = 'a.out'

    trips = []
    with open(in_file) as f:
        for i, line in enumerate(iter(f)):
            line = line.strip()
            if i == 0:
                r, c, f, n, b, t = list(map(int, line.split()))
                R = r
                C = c
                F = f
                N = n
                B = b
                T = t
            else:
                cur_trip = Trip(i - 1, *list(map(int, line.split())))
                trips.append(cur_trip)

    ### LOGIC GOES HERE ###

    allocation = [[] for i in range(F)]

    ### LOGIC ENDS HERE ###

    with open(out_file, 'w') as f:
        for route in allocation:
            f.write('{} '.format(len(route)))
            for ride in route:
                f.write('{} '.format(ride))
            f.write('\n')

if __name__ == '__main__':
    main()
