#define _CRT_SECURE_NO_WARNINGS

#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include <algorithm>

using std::vector;

int R, C, F, N, B, T;

struct ride
{
	int a, b, x, y, s, f;
};

void read_problem(const std::string& filename, vector<ride> &rides)
{
	FILE* f = fopen(filename.c_str(), "r");

	if (!f)
		printf("Error opening file...\n");

	fscanf(f, "%d %d %d %d %d %d",
		&R, &C, &F, &N, &B, &T);

	rides = vector<ride>(N);

	for (int i = 0; i < N; i++)
	{
		auto &r = rides[i];
		fscanf(f, "%d %d %d %d %d %d", &r.a, &r.b, &r.x, &r.y, &r.s, &r.f);
	}

	fclose(f);
}

void save_result(const std::string& filename, const vector<vector<int>> allocation)
{
	FILE* f = fopen(filename.c_str(), "w");

	if (!f)
		printf("Error opening file...\n");

	for (auto &rides : allocation)
	{
		fprintf(f, "%d ", rides.size());
		for (int r : rides)
			fprintf(f, "%d ", r);
		fprintf(f, "\n");
	}

	fclose(f);
}

int main()
{
	const char* filename = "a.in";

	vector<ride> rides;
	read_problem(filename, rides);

	vector<vector<int>> allocation(F);

	// Compute your allocation

	save_result("a.out", allocation);

	printf("Press enter to close...\n");
	// Don't close the window
	getchar();

	return 0;
}